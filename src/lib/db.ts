import { supabase } from './supabase';
import type {
  CheckIn,
  ChatMessage,
  DailyTask,
  Goal,
  GoalCategory,
  GoalContext,
  Milestone,
  Phase,
  Roadmap,
} from '@/types';
import type { RoadmapDraftPhase } from './api';

/**
 * Data access for Polaris. Maps snake_case Supabase rows to the camelCase
 * domain model and centralizes every query so screens stay declarative.
 * RLS guarantees each user only ever sees their own rows.
 */

const todayISO = () => new Date().toISOString().slice(0, 10);

// ---- mappers ----
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapGoal = (r: any): Goal => ({
  id: r.id,
  userId: r.user_id,
  title: r.title,
  summary: r.summary,
  category: r.category,
  context: r.context ?? null,
  status: r.status,
  momentum: r.momentum ?? 0,
  createdAt: r.created_at,
});

const mapMilestone = (r: any): Milestone => ({
  id: r.id,
  phaseId: r.phase_id,
  title: r.title,
  description: r.description ?? '',
  order: r.order,
  status: r.status,
  completedAt: r.completed_at ?? null,
});

const mapPhase = (r: any): Phase => ({
  id: r.id,
  roadmapId: r.roadmap_id,
  title: r.title,
  description: r.description ?? '',
  order: r.order,
  status: r.status,
  milestones: (r.milestones ?? []).map(mapMilestone).sort((a: Milestone, b: Milestone) => a.order - b.order),
});

const mapTask = (r: any): DailyTask => ({
  id: r.id,
  userId: r.user_id,
  goalId: r.goal_id,
  milestoneId: r.milestone_id ?? null,
  date: r.date,
  title: r.title,
  detail: r.detail ?? null,
  status: r.status,
  order: r.order ?? 0,
});

const mapMessage = (r: any): ChatMessage => ({
  id: r.id,
  userId: r.user_id,
  goalId: r.goal_id,
  role: r.role,
  content: r.content ?? '',
  artifact: r.artifact ?? null,
  createdAt: r.created_at,
});

const mapCheckIn = (r: any): CheckIn => ({
  id: r.id,
  userId: r.user_id,
  goalId: r.goal_id,
  date: r.date,
  mood: r.mood ?? null,
  note: r.note ?? null,
  mentorReply: r.mentor_reply ?? null,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---- profile ----
export async function getProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data
    ? {
        id: data.id,
        displayName: data.display_name,
        age: data.age,
        timezone: data.timezone,
        createdAt: data.created_at,
      }
    : null;
}

export async function updateProfile(userId: string, patch: { displayName?: string; age?: number }) {
  await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: patch.displayName, age: patch.age })
    .throwOnError();
}

// ---- goals ----
export async function getActiveGoal(userId: string): Promise<Goal | null> {
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapGoal(data) : null;
}

export async function createGoal(
  userId: string,
  input: { title: string; summary: string | null; category: GoalCategory; context: GoalContext },
): Promise<Goal> {
  const { data } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: input.title,
      summary: input.summary,
      category: input.category,
      context: input.context,
      status: 'active',
      momentum: 0,
    })
    .select('*')
    .single()
    .throwOnError();
  return mapGoal(data);
}

export async function updateGoalMomentum(goalId: string, momentum: number) {
  await supabase.from('goals').update({ momentum }).eq('id', goalId).throwOnError();
}

/** Persist the goal's context jsonb (level, learned facts, memory summary, etc.). */
export async function updateGoalContext(goalId: string, context: GoalContext) {
  await supabase.from('goals').update({ context }).eq('id', goalId).throwOnError();
}

// ---- roadmap ----
export async function getRoadmap(goalId: string): Promise<Roadmap | null> {
  const { data } = await supabase
    .from('roadmaps')
    .select('*, phases(*, milestones(*))')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    goalId: data.goal_id,
    overview: data.overview,
    createdAt: data.created_at,
    phases: (data.phases ?? []).map(mapPhase).sort((a: Phase, b: Phase) => a.order - b.order),
  };
}

/** Persists a generated roadmap draft, unlocking the first phase + milestone. */
export async function saveRoadmap(
  userId: string,
  goalId: string,
  draft: { overview: string; phases: RoadmapDraftPhase[] },
): Promise<Roadmap> {
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .insert({ user_id: userId, goal_id: goalId, overview: draft.overview })
    .select('*')
    .single()
    .throwOnError();

  for (let pi = 0; pi < draft.phases.length; pi++) {
    const p = draft.phases[pi];
    const { data: phase } = await supabase
      .from('phases')
      .insert({
        roadmap_id: roadmap.id,
        user_id: userId,
        title: p.title,
        description: p.description,
        order: pi,
        status: pi === 0 ? 'active' : 'locked',
      })
      .select('*')
      .single()
      .throwOnError();

    const milestoneRows = p.milestones.map((m, mi) => ({
      phase_id: phase.id,
      user_id: userId,
      title: m.title,
      description: m.description,
      order: mi,
      status: pi === 0 && mi === 0 ? 'active' : 'locked',
    }));
    if (milestoneRows.length) {
      await supabase.from('milestones').insert(milestoneRows).throwOnError();
    }
  }

  return (await getRoadmap(goalId))!;
}

export async function setMilestoneStatus(milestoneId: string, status: Milestone['status']) {
  await supabase
    .from('milestones')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId)
    .throwOnError();
}

export async function setPhaseStatus(phaseId: string, status: Phase['status']) {
  await supabase.from('phases').update({ status }).eq('id', phaseId).throwOnError();
}

// ---- daily tasks ----
export async function getTodayTasks(userId: string, goalId: string): Promise<DailyTask[]> {
  const { data } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .eq('date', todayISO())
    .order('order', { ascending: true });
  return (data ?? []).map(mapTask);
}

export async function saveTasks(
  userId: string,
  goalId: string,
  drafts: { title: string; detail: string; milestoneHint: string | null }[],
): Promise<DailyTask[]> {
  const rows = drafts.map((d, i) => ({
    user_id: userId,
    goal_id: goalId,
    title: d.title,
    detail: d.detail,
    date: todayISO(),
    order: i,
    status: 'pending',
  }));
  const { data } = await supabase.from('daily_tasks').insert(rows).select('*').throwOnError();
  return (data ?? []).map(mapTask);
}

export async function setTaskStatus(taskId: string, status: DailyTask['status']) {
  await supabase.from('daily_tasks').update({ status }).eq('id', taskId).throwOnError();
}

export async function getRecentTasks(userId: string, goalId: string, limit = 8) {
  const { data } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapTask);
}

// ---- messages ----
export async function getMessages(goalId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapMessage);
}

export async function addMessage(input: {
  userId: string;
  goalId: string;
  role: ChatMessage['role'];
  content: string;
  artifact?: ChatMessage['artifact'];
}): Promise<ChatMessage> {
  const { data } = await supabase
    .from('messages')
    .insert({
      user_id: input.userId,
      goal_id: input.goalId,
      role: input.role,
      content: input.content,
      artifact: input.artifact ?? null,
    })
    .select('*')
    .single()
    .throwOnError();
  return mapMessage(data);
}

/** Batch insert (used to persist the onboarding conversation into memory). */
export async function addMessages(
  rows: { userId: string; goalId: string; role: ChatMessage['role']; content: string }[],
): Promise<ChatMessage[]> {
  if (rows.length === 0) return [];
  const { data } = await supabase
    .from('messages')
    .insert(
      rows.map((r) => ({ user_id: r.userId, goal_id: r.goalId, role: r.role, content: r.content })),
    )
    .select('*')
    .throwOnError();
  return ((data ?? []) as unknown[])
    .map(mapMessage)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---- check-ins ----
export async function addCheckIn(input: {
  userId: string;
  goalId: string;
  mood: number | null;
  note: string | null;
  mentorReply: string | null;
}): Promise<CheckIn> {
  const { data } = await supabase
    .from('checkins')
    .insert({
      user_id: input.userId,
      goal_id: input.goalId,
      mood: input.mood,
      note: input.note,
      mentor_reply: input.mentorReply,
    })
    .select('*')
    .single()
    .throwOnError();
  return mapCheckIn(data);
}

export async function getRecentCheckIns(userId: string, goalId: string, limit = 30) {
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapCheckIn);
}
