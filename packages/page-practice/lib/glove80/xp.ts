import { type Result } from "@keybr/result";

export type Mood = "happy" | "ok" | "sad" | "sleepy";

export type BuddyState = {
  /** Total experience points. */
  readonly xp: number;
  /** Current level, starting at 1. */
  readonly level: number;
  /** Experience points earned inside the current level. */
  readonly levelXp: number;
  /** Experience points the current level takes in total. */
  readonly levelSize: number;
  /** Number of consecutive days with practice, ending today or yesterday. */
  readonly streak: number;
  /** Whether there was any practice today. */
  readonly today: boolean;
  readonly mood: Mood;
};

const day = 24 * 60 * 60 * 1000;

/** Experience points for a single lesson. */
export function lessonXp({ length, accuracy }: Result): number {
  const base = (length * accuracy * accuracy) / 5;
  const bonus = accuracy >= 0.97 ? 10 : 0;
  return Math.round(base + bonus);
}

/** Total experience points needed to reach the given level. */
export function xpToReach(level: number): number {
  return 50 * level * (level - 1);
}

export function levelOf(xp: number): number {
  let level = 1;
  while (xpToReach(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/** Local calendar day number, used to count streaks. */
export function dayOf(timeStamp: number): number {
  const date = new Date(timeStamp);
  return Math.floor((timeStamp - date.getTimezoneOffset() * 60 * 1000) / day);
}

export function streakOf(timeStamps: Iterable<number>, now: number): number {
  const days = new Set<number>();
  for (const timeStamp of timeStamps) {
    days.add(dayOf(timeStamp));
  }
  let current = dayOf(now);
  if (!days.has(current)) {
    current -= 1;
  }
  let streak = 0;
  while (days.has(current)) {
    streak += 1;
    current -= 1;
  }
  return streak;
}

export function buddyState(
  results: readonly Result[],
  extraXp: number,
  extraDays: Iterable<number>,
  now: number,
): BuddyState {
  let xp = extraXp;
  for (const result of results) {
    xp += lessonXp(result);
  }
  const level = levelOf(xp);
  const levelXp = xp - xpToReach(level);
  const levelSize = xpToReach(level + 1) - xpToReach(level);
  const timeStamps = [...results.map((r) => r.timeStamp), ...extraDays];
  const streak = streakOf(timeStamps, now);
  const today = timeStamps.some((t) => dayOf(t) === dayOf(now));
  return {
    xp,
    level,
    levelXp,
    levelSize,
    streak,
    today,
    mood: moodOf(results, today),
  };
}

function moodOf(results: readonly Result[], today: boolean): Mood {
  if (!today) {
    return "sleepy";
  }
  const last = results.at(-1);
  if (last == null) {
    return "ok";
  }
  if (last.accuracy >= 0.97) {
    return "happy";
  }
  if (last.accuracy < 0.9) {
    return "sad";
  }
  return "ok";
}

export type Stage = {
  readonly level: number;
  readonly name: string;
};

/** The buddy picks up gear as it levels up. */
export const stages: readonly Stage[] = [
  { level: 1, name: "Blob" },
  { level: 3, name: "Gloved" },
  { level: 6, name: "Headband" },
  { level: 10, name: "Cape" },
  { level: 15, name: "Crown" },
  { level: 25, name: "Legend" },
];

export function stageOf(level: number): number {
  let stage = 0;
  stages.forEach((item, index) => {
    if (level >= item.level) {
      stage = index;
    }
  });
  return stage;
}
