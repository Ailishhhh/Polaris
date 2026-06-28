import { create } from 'zustand';
import type {
  CheckIn,
  ChatMessage,
  DailyTask,
  Goal,
  GoalCategory,
  GoalContext,
  Milestone,
  Profile,
  Roadmap,
  Streak,
  TaskStatus,
} from '@/types';
import * as db from '@/lib/db';
import {
  generateDailyTasks,
  generateRoadmap,
  sendCheckIn as apiSendCheckIn,
  streamMentorReply,
  type ChatTurn,
} from '@/lib/api';
import {
  activeDatesFrom,
  buildMentorMemory,
  computeMomentum,
  computeStreak,
} from '@/lib/memory';

interface MentorState {
  // data
  profile: Profile | null;
  goal: Goal | null;
  roadmap: Roadmap | null;
  todayTasks: DailyTask[];
  messages: ChatMessage[];
  checkIns: CheckIn[];
  streak: Streak;
  momentum: number;

  // ui
  hydrated: boolean;
  busy: boolean;
  streamingId: string | null;
  isThinking: boolean;
  error: string | null;

  // lifecycle
  hydrate: (userId: string) => Promise<void>;
  reset: () => void;

  // onboarding
  completeOnboarding: (
    userId: string,
    input: {
      displayName: string | null;
      age: number | null;
      title: string;
      summary: string | null;
      category: GoalCategory;
      context: GoalContext;
    },
  ) => Promise<void>;

  // chat
  sendMessage: (text: string) => Promise<void>;
  regenerateLast: () => Promise<void>;
  stopStreaming: () => void;

  // progress
  toggleMilestone: (m: Milestone) => Promise<void>;
  toggleTask: (t: DailyTask) => Promise<void>;
  skipTask: (t: DailyTask) => Promise<void>;
  refreshTodayTasks: () => Promise<void>;
  submitCheckIn: (mood: number | null, note: string) => Promise<string>;
}

let abortController: AbortController | null = null;

const emptyStreak: Streak = { current: 0, longest: 0, lastActiveDate: null };

export const useMentor = create<MentorState>((set, get) => ({
  profile: null,
  goal: null,
  roadmap: null,
  todayTasks: [],
  messages: [],
  checkIns: [],
  streak: emptyStreak,
  momentum: 0,

  hydrated: false,
  busy: false,
  streamingId: null,
  isThinking: false,
  error: null,

  reset: () =>
    set({
      profile: null,
      goal: null,
      roadmap: null,
      todayTasks: [],
      messages: [],
      checkIns: [],
      streak: emptyStreak,
      momentum: 0,
      hydrated: false,
    }),

  hydrate: async (userId) => {
    try {
      const [profile, goal] = await Promise.all([db.getProfile(userId), db.getActiveGoal(userId)]);
      if (!goal) {
        set({ profile, goal: null, hydrated: true });
        return;
      }
      const [roadmap, todayTasks, messages, recentTasks, checkIns] = await Promise.all([
        db.getRoadmap(goal.id),
        db.getTodayTasks(userId, goal.id),
        db.getMessages(goal.id),
        db.getRecentTasks(userId, goal.id),
        db.getRecentCheckIns(userId, goal.id),
      ]);
      const streak = computeStreak(activeDatesFrom(recentTasks, checkIns));
      const momentum = computeMomentum(roadmap, recentTasks);
      set({ profile, goal, roadmap, todayTasks, messages, checkIns, streak, momentum, hydrated: true });
    } catch (e) {
      set({ error: errMsg(e), hydrated: true });
    }
  },

  completeOnboarding: async (userId, input) => {
    set({ busy: true, error: null });
    try {
      if (input.displayName || input.age) {
        await db.updateProfile(userId, {
          displayName: input.displayName ?? undefined,
          age: input.age ?? undefined,
        });
      }
      const goal = await db.createGoal(userId, {
        title: input.title,
        summary: input.summary,
        category: input.category,
        context: input.context,
      });

      const draft = await generateRoadmap({
        goalTitle: input.title,
        category: input.category,
        context: input.context,
      });
      const roadmap = await db.saveRoadmap(userId, goal.id, draft);

      // Seed the thread with the mentor's framing + the roadmap artifact.
      const intro = `Welcome${input.displayName ? `, ${input.displayName}` : ''}. ${roadmap.overview}\n\nI've mapped out your journey below. We'll move one milestone at a time — and I'll be here every day. Ready when you are.`;
      const seeded = await db.addMessage({
        userId,
        goalId: goal.id,
        role: 'assistant',
        content: intro,
        artifact: { type: 'roadmap', roadmap },
      });

      const profile = await db.getProfile(userId);
      const momentum = computeMomentum(roadmap, []);

      set({
        profile,
        goal: { ...goal, momentum },
        roadmap,
        messages: [seeded],
        momentum,
        streak: emptyStreak,
      });

      // Generate today's first tasks in the background.
      await get().refreshTodayTasks();
    } catch (e) {
      set({ error: errMsg(e) });
      throw e;
    } finally {
      set({ busy: false });
    }
  },

  sendMessage: async (text) => {
    const { goal, profile, roadmap, todayTasks, checkIns, streak, momentum, messages } = get();
    if (!goal) return;
    const userId = goal.userId;

    // Persist + show the user message.
    const userMsg = await db.addMessage({ userId, goalId: goal.id, role: 'user', content: text });
    const placeholderId = `streaming-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: placeholderId,
      userId,
      goalId: goal.id,
      role: 'assistant',
      content: '',
      artifact: null,
      createdAt: new Date().toISOString(),
    };
    set({
      messages: [...messages, userMsg, placeholder],
      streamingId: placeholderId,
      isThinking: true,
      error: null,
    });

    const memory = buildMentorMemory({
      profile,
      goal,
      roadmap,
      recentTasks: todayTasks,
      checkIns,
      streak,
      momentum,
    });
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));

    abortController = new AbortController();
    try {
      await streamMentorReply(
        { memory, history, message: text },
        {
          signal: abortController.signal,
          onToken: (chunk) => {
            set((s) => ({
              isThinking: false,
              messages: s.messages.map((m) =>
                m.id === placeholderId ? { ...m, content: m.content + chunk } : m,
              ),
            }));
          },
        },
      );

      const finalContent = get().messages.find((m) => m.id === placeholderId)?.content ?? '';
      const saved = await db.addMessage({
        userId,
        goalId: goal.id,
        role: 'assistant',
        content: finalContent,
      });
      set((s) => ({
        streamingId: null,
        isThinking: false,
        messages: s.messages.map((m) => (m.id === placeholderId ? saved : m)),
      }));
    } catch (e) {
      set((s) => ({
        streamingId: null,
        isThinking: false,
        error: errMsg(e),
        messages: s.messages.map((m) =>
          m.id === placeholderId
            ? { ...m, content: m.content || 'I lost my train of thought — tap regenerate to retry.' }
            : m,
        ),
      }));
    } finally {
      abortController = null;
    }
  },

  regenerateLast: async () => {
    const { messages } = get();
    // Find the last user message and replay it.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    // Drop the trailing assistant message from view before regenerating.
    set({ messages: messages.filter((m) => !(m.role === 'assistant' && m === messages[messages.length - 1])) });
    await get().sendMessage(lastUser.content);
  },

  stopStreaming: () => {
    abortController?.abort();
    set({ streamingId: null, isThinking: false });
  },

  toggleMilestone: async (m) => {
    const { roadmap, goal, todayTasks } = get();
    if (!roadmap || !goal) return;
    const next = m.status === 'completed' ? 'active' : 'completed';
    await db.setMilestoneStatus(m.id, next);

    const updated: Roadmap = {
      ...roadmap,
      phases: roadmap.phases.map((p) => ({
        ...p,
        milestones: p.milestones.map((mm) =>
          mm.id === m.id
            ? { ...mm, status: next, completedAt: next === 'completed' ? new Date().toISOString() : null }
            : mm,
        ),
      })),
    };
    const momentum = computeMomentum(updated, todayTasks);
    await db.updateGoalMomentum(goal.id, momentum);
    set({ roadmap: updated, momentum, goal: { ...goal, momentum } });
  },

  toggleTask: async (t) => {
    const next: TaskStatus = t.status === 'done' ? 'pending' : 'done';
    await db.setTaskStatus(t.id, next);
    const todayTasks = get().todayTasks.map((x) => (x.id === t.id ? { ...x, status: next } : x));
    const { roadmap, goal } = get();
    const momentum = computeMomentum(roadmap, todayTasks);
    if (goal) await db.updateGoalMomentum(goal.id, momentum);
    set({ todayTasks, momentum, goal: goal ? { ...goal, momentum } : goal });
  },

  skipTask: async (t) => {
    await db.setTaskStatus(t.id, 'skipped');
    set({
      todayTasks: get().todayTasks.map((x) =>
        x.id === t.id ? { ...x, status: 'skipped' as const } : x,
      ),
    });
  },

  refreshTodayTasks: async () => {
    const { goal, profile, roadmap, checkIns, streak, momentum } = get();
    if (!goal) return;
    const existing = await db.getTodayTasks(goal.userId, goal.id);
    if (existing.length > 0) {
      set({ todayTasks: existing });
      return;
    }
    const memory = buildMentorMemory({
      profile,
      goal,
      roadmap,
      recentTasks: existing,
      checkIns,
      streak,
      momentum,
    });
    const drafts = await generateDailyTasks({ memory });
    const tasks = await db.saveTasks(goal.userId, goal.id, drafts);
    set({ todayTasks: tasks });
  },

  submitCheckIn: async (mood, note) => {
    const { goal, profile, roadmap, todayTasks, checkIns, streak, momentum } = get();
    if (!goal) return '';
    const memory = buildMentorMemory({
      profile,
      goal,
      roadmap,
      recentTasks: todayTasks,
      checkIns,
      streak,
      momentum,
    });
    const { reply } = await apiSendCheckIn({ memory, mood, note });
    const saved = await db.addCheckIn({
      userId: goal.userId,
      goalId: goal.id,
      mood,
      note: note || null,
      mentorReply: reply,
    });
    const nextCheckIns = [saved, ...checkIns];
    const nextStreak = computeStreak(activeDatesFrom(todayTasks, nextCheckIns));
    set({ checkIns: nextCheckIns, streak: nextStreak });
    return reply;
  },
}));

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}
