import type {
  CheckIn,
  DailyTask,
  Goal,
  MentorMemory,
  Profile,
  Roadmap,
  Streak,
} from '@/types';

/**
 * Visible 0..100 momentum. Driven mostly by milestone completion (the real
 * structural progress) with a small lift from recent daily follow-through so
 * the number moves even between milestones.
 */
export function computeMomentum(roadmap: Roadmap | null, recentTasks: DailyTask[]): number {
  if (!roadmap) return 0;
  const milestones = roadmap.phases.flatMap((p) => p.milestones);
  if (milestones.length === 0) return 0;

  const done = milestones.filter((m) => m.status === 'completed').length;
  const structural = (done / milestones.length) * 90; // up to 90 from milestones

  const last7 = recentTasks.filter((t) => t.status === 'done').slice(0, 7).length;
  const consistency = Math.min(1, last7 / 5) * 10; // up to 10 from recent follow-through

  return Math.round(Math.min(100, structural + consistency));
}

/** A day "counts" if the user checked in or completed at least one task. */
export function computeStreak(activeDates: string[]): Streak {
  const set = new Set(activeDates);
  if (set.size === 0) return { current: 0, longest: 0, lastActiveDate: null };

  const sorted = [...set].sort(); // ascending ISO
  const lastActiveDate = sorted[sorted.length - 1];

  // longest run of consecutive calendar days
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (dayDiff(sorted[i - 1], sorted[i]) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // current run must include today or yesterday
  const today = new Date().toISOString().slice(0, 10);
  const gapFromToday = dayDiff(lastActiveDate, today);
  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (dayDiff(sorted[i - 1], sorted[i]) === 1) current += 1;
      else break;
    }
  }

  return { current, longest, lastActiveDate };
}

function dayDiff(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime();
  return Math.round(ms / 86400000);
}

/** Assemble the compact memory packet the backend uses on every mentor call. */
export function buildMentorMemory(params: {
  profile: Profile | null;
  goal: Goal;
  roadmap: Roadmap | null;
  recentTasks: DailyTask[];
  checkIns: CheckIn[];
  streak: Streak;
  momentum: number;
}): MentorMemory {
  const { profile, goal, roadmap, recentTasks, checkIns, streak, momentum } = params;

  const currentPhase = roadmap?.phases.find((p) => p.status === 'active') ?? roadmap?.phases[0];
  const activeMilestones =
    roadmap?.phases
      .flatMap((p) => p.milestones)
      .filter((m) => m.status === 'active')
      .map((m) => m.title) ?? [];

  const lastCheckIn = checkIns[0] ?? null;

  return {
    profile: { displayName: profile?.displayName ?? null, age: profile?.age ?? null },
    goal: {
      title: goal.title,
      summary: goal.summary,
      category: goal.category,
      context: goal.context,
      momentum,
    },
    roadmapOverview: roadmap?.overview ?? null,
    currentPhase: currentPhase?.title ?? null,
    activeMilestones,
    recentTasks: recentTasks.slice(0, 6).map((t) => ({ title: t.title, status: t.status, date: t.date })),
    streak,
    lastCheckIn: lastCheckIn
      ? { date: lastCheckIn.date, note: lastCheckIn.note, mood: lastCheckIn.mood }
      : null,
  };
}

/** Collect the set of "active" days (checkins + completed task days). */
export function activeDatesFrom(tasks: DailyTask[], checkIns: CheckIn[]): string[] {
  const dates = new Set<string>();
  tasks.filter((t) => t.status === 'done').forEach((t) => dates.add(t.date));
  checkIns.forEach((c) => dates.add(c.date));
  return [...dates];
}
