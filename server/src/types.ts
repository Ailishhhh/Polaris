// Mirror of the app-side domain types the backend actually consumes.

export type TaskStatus = 'pending' | 'done' | 'skipped';
export type ChatRole = 'user' | 'assistant' | 'system';

export interface MentorMemory {
  profile: { displayName: string | null; age: number | null };
  goal: {
    title: string;
    summary: string | null;
    category: string;
    context: {
      level: string | null;
      weeklyHours: number | null;
      motivation: string | null;
      constraints: string | null;
      targetDate: string | null;
      /** Durable facts Polaris has learned about the user over time. */
      learned?: string[] | null;
      /** Rolling summary of the relationship so long history never gets lost. */
      memorySummary?: string | null;
    } | null;
    momentum: number;
  };
  roadmapOverview: string | null;
  currentPhase: string | null;
  activeMilestones: string[];
  recentTasks: { title: string; status: TaskStatus; date: string }[];
  streak: { current: number; longest: number; lastActiveDate: string | null };
  lastCheckIn: { date: string; note: string | null; mood: number | null } | null;
}

export interface ChatTurn {
  role: ChatRole;
  content: string;
}
