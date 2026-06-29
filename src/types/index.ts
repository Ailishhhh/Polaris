/**
 * Polaris domain model.
 *
 * The moat lives here: a goal is decomposed into a roadmap (phases -> milestones),
 * surfaced as daily tasks, mentored through remembered chat, and measured as
 * visible 0 -> 100 momentum.
 */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

export type GoalCategory =
  | 'trading'
  | 'art'
  | 'fitness'
  | 'coding'
  | 'exams'
  | 'startup'
  | 'music'
  | 'language'
  | 'other';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ItemStatus = 'locked' | 'active' | 'completed';
export type TaskStatus = 'pending' | 'done' | 'skipped';
export type ChatRole = 'user' | 'assistant' | 'system';

export interface Profile {
  id: ID;
  displayName: string | null;
  age: number | null;
  timezone: string | null;
  createdAt: ISODateTime;
}

export interface Goal {
  id: ID;
  userId: ID;
  title: string;
  /** One-line restatement of intent, in the user's words. */
  summary: string | null;
  category: GoalCategory;
  /** Freeform context captured during onboarding (level, time/week, why). */
  context: GoalContext | null;
  status: GoalStatus;
  /** 0..100 cached momentum, recomputed when milestones change. */
  momentum: number;
  createdAt: ISODateTime;
}

export interface GoalContext {
  level: string | null; // "complete beginner", "intermediate"...
  weeklyHours: number | null;
  motivation: string | null; // the user's "why"
  constraints: string | null; // time, money, gear
  targetDate: ISODate | null;
}

export interface Roadmap {
  id: ID;
  goalId: ID;
  /** Short narrative the mentor wrote framing the journey. */
  overview: string;
  phases: Phase[];
  createdAt: ISODateTime;
}

export interface Phase {
  id: ID;
  roadmapId: ID;
  title: string;
  description: string;
  order: number;
  status: ItemStatus;
  milestones: Milestone[];
}

export interface Milestone {
  id: ID;
  phaseId: ID;
  title: string;
  description: string;
  order: number;
  status: ItemStatus;
  completedAt: ISODateTime | null;
}

export interface DailyTask {
  id: ID;
  userId: ID;
  goalId: ID;
  milestoneId: ID | null;
  date: ISODate;
  title: string;
  detail: string | null;
  status: TaskStatus;
  order: number;
}

export interface CheckIn {
  id: ID;
  userId: ID;
  goalId: ID;
  date: ISODate;
  mood: number | null; // 1..5
  note: string | null;
  /** What the mentor said back after the check-in. */
  mentorReply: string | null;
  createdAt: ISODateTime;
}

export interface ChatMessage {
  id: ID;
  userId: ID;
  goalId: ID;
  role: ChatRole;
  content: string;
  /** Optional structured artifact rendered as a card inside the thread. */
  artifact: MessageArtifact | null;
  createdAt: ISODateTime;
}

export type MessageArtifact =
  | { type: 'roadmap'; roadmap: Roadmap }
  | { type: 'tasks'; tasks: DailyTask[] }
  | { type: 'milestone'; milestone: Milestone };

export interface Streak {
  current: number;
  longest: number;
  lastActiveDate: ISODate | null;
}

/** Lightweight memory packet sent to the backend so the mentor never forgets. */
export interface MentorMemory {
  profile: Pick<Profile, 'displayName' | 'age'>;
  goal: Pick<Goal, 'title' | 'summary' | 'category' | 'context' | 'momentum'>;
  roadmapOverview: string | null;
  currentPhase: string | null;
  activeMilestones: string[];
  recentTasks: { title: string; status: TaskStatus; date: ISODate }[];
  streak: Streak;
  lastCheckIn: { date: ISODate; note: string | null; mood: number | null } | null;
}

/** What organic onboarding silently infers from the conversation. */
export interface OnboardingSketch {
  displayName: string | null;
  goalTitle: string | null;
  category: GoalCategory | null;
  level: string | null;
  weeklyHours: number | null;
  motivation: string | null;
  readyToBuild: boolean;
}
