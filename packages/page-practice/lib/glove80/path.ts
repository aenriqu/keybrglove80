import { type Result } from "@keybr/result";

/*
 * The learning path. Each stage has one clear goal, and reaching it
 * unlocks the tools that fit the next step, so practice escalates
 * at the learner's own pace instead of all at once.
 */

export type StageInfo = {
  readonly name: string;
  readonly goal: string;
  /** What the stage turns on, shown when it is reached. */
  readonly unlocks: string;
  /** What to do in today's session. */
  readonly today: string;
};

/** Words per minute to leave stage 3, where MoErgo suggests going full-time. */
const speedGoal = 40;

export const stages: readonly StageInfo[] = [
  {
    name: "Find home",
    goal: "5 lessons at 90% accuracy or better",
    unlocks: "Finger hints and the coach",
    today:
      "2 or 3 short lessons. Go slow, read the finger hint before every key, never look down.",
  },
  {
    name: "Learn the letters",
    goal: "Unlock all 26 letters",
    unlocks: "Mastered letters fade from the on-screen keyboard",
    today:
      "10 to 15 minutes of lessons. A new letter unlocks when the current ones are fast enough.",
  },
  {
    name: "Build speed",
    goal: `Average ${speedGoal} wpm at 96% accuracy over 10 lessons`,
    unlocks: "The pace line, and Letter Pairs aimed at your weakest finger",
    today:
      "Lessons with the pace line, then one round of Letter Pairs. Chase the marker, keep accuracy up.",
  },
  {
    name: "Numbers and symbols",
    goal: "Pass the Numbers and Symbols drills at 96%",
    unlocks: "Number and symbol drills",
    today:
      "One round each of Numbers and Symbols, then normal lessons to keep the letters sharp.",
  },
  {
    name: "Go full-time",
    goal: "Use the Glove80 for everything",
    unlocks: "Everything. Real text: try the Typing Test page",
    today:
      "Type real work on the Glove80. A short lesson a day keeps the weak keys improving.",
  },
];

/** Accuracy needed to pass a drill round, and the stage 4 drills. */
export const drillPass = 0.96;

export type Stage = {
  /** Index into `stages`. */
  readonly index: number;
  /** Progress towards the current stage goal, from 0 to 1. */
  readonly progress: number;
  /** Short progress text, e.g. "12 / 26 letters". */
  readonly detail: string;
};

/**
 * Where the learner is on the path, from results and drill scores.
 * Stages before `reached` stay passed, a bad day never demotes.
 */
export function pathStage(
  results: readonly Result[],
  best: { readonly [mode: string]: number },
  reached = 0,
): Stage {
  // Stage 1: five clean lessons.
  const clean = results.filter(({ accuracy }) => accuracy >= 0.9).length;
  if (reached <= 0 && clean < 5) {
    return {
      index: 0,
      progress: clean / 5,
      detail: `${clean} / 5 clean lessons`,
    };
  }
  // Stage 2: guided lessons only contain unlocked letters.
  const letters = unlockedLetters(results.at(-1));
  if (reached <= 1 && letters < 26) {
    return {
      index: 1,
      progress: letters / 26,
      detail: `${letters} / 26 letters`,
    };
  }
  // Stage 3: speed with accuracy.
  const recent = results.slice(-10);
  const wpm = average(recent.map(({ speed }) => speed / 5));
  const accuracy = average(recent.map(({ accuracy }) => accuracy));
  if (
    reached <= 2 &&
    (recent.length < 10 || wpm < speedGoal || accuracy < 0.96)
  ) {
    return {
      index: 2,
      progress: Math.min(1, wpm / speedGoal) * (accuracy >= 0.96 ? 1 : 0.9),
      detail: `${Math.round(wpm)} / ${speedGoal} wpm, ${Math.floor(accuracy * 100)}% accuracy`,
    };
  }
  // Stage 4: the number and symbol drills.
  const passed = ["numbers", "symbols"].filter(
    (mode) => (best[mode] ?? 0) >= drillPass * 100,
  ).length;
  if (reached <= 3 && passed < 2) {
    return {
      index: 3,
      progress: passed / 2,
      detail: `${passed} / 2 drills passed`,
    };
  }
  return { index: 4, progress: 1, detail: "All stages done" };
}

function unlockedLetters(result: Result | undefined): number {
  const letters = new Set<string>();
  for (const { codePoint } of result?.histogram ?? []) {
    const char = String.fromCodePoint(codePoint).toLowerCase();
    if (char >= "a" && char <= "z") {
      letters.add(char);
    }
  }
  return letters.size;
}

function average(values: readonly number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

const day = 24 * 60 * 60 * 1000;

export type WeekStats = {
  readonly lessons: number;
  readonly minutes: number;
  readonly accuracy: number;
  readonly wpm: number;
};

export type WeekSummary = {
  readonly week: WeekStats;
  readonly previous: WeekStats | null;
  /** A plain answer to "am I doing well?". */
  readonly verdict: string;
};

/** This week against the week before. */
export function weekSummary(
  results: readonly Result[],
  now: number,
): WeekSummary {
  const stats = (from: number, to: number): WeekStats | null => {
    const list = results.filter(
      ({ timeStamp }) => timeStamp > from && timeStamp <= to,
    );
    if (list.length === 0) {
      return null;
    }
    return {
      lessons: list.length,
      minutes: list.reduce((sum, { time }) => sum + time, 0) / 60000,
      accuracy: average(list.map(({ accuracy }) => accuracy)),
      wpm: average(list.map(({ speed }) => speed / 5)),
    };
  };
  const week = stats(now - 7 * day, now);
  const previous = stats(now - 14 * day, now - 7 * day);
  if (week == null) {
    return {
      week: { lessons: 0, minutes: 0, accuracy: 0, wpm: 0 },
      previous,
      verdict: "No lessons this week yet. A few short ones beat one long one.",
    };
  }
  return { week, previous, verdict: verdict(week, previous) };
}

function verdict(week: WeekStats, previous: WeekStats | null): string {
  const pct = (n: number) => `${Math.floor(n * 100)}%`;
  if (previous == null) {
    return week.accuracy >= 0.96
      ? `First week: ${pct(week.accuracy)} accuracy. Clean typing, you are on track.`
      : `First week: ${pct(week.accuracy)} accuracy. Normal for a new keyboard, keep it slow until it is 96%.`;
  }
  const change = `Accuracy ${pct(previous.accuracy)} → ${pct(week.accuracy)}, speed ${Math.round(previous.wpm)} → ${Math.round(week.wpm)} wpm.`;
  if (week.accuracy < previous.accuracy - 0.02) {
    return `${change} Accuracy slipped, slow down a little.`;
  }
  if (week.wpm > previous.wpm + 1 || week.accuracy > previous.accuracy + 0.01) {
    return `${change} Improving, you are on track.`;
  }
  return `${change} Holding steady. Push past it with the pace line or Letter Pairs.`;
}

/** Minutes typed in the current session: lessons less than 20 minutes apart. */
export function sessionMinutes(
  results: readonly Result[],
  now: number,
): number {
  const gap = 20 * 60 * 1000;
  let last = now;
  let time = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    const { timeStamp } = results[i];
    if (last - timeStamp > gap) {
      break;
    }
    time += results[i].time;
    last = timeStamp;
  }
  return time / 60000;
}
