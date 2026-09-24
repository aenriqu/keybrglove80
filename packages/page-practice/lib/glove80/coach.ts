import { type Result } from "@keybr/result";

const habits = [
  "Rest on the home keys (A S D F, J K L ;) and come back to them after every key.",
  "Eyes on the screen. Peek at the on-screen Glove80, never at your hands.",
  "Tap lightly. The keys fire before they bottom out.",
  "Thumbs own Space and Backspace. Keep them resting on the thumb cluster.",
  "Each finger stays in its own column. Reach, press, return.",
  "Keep your wrists floating and your shoulders loose.",
  "Tired or sloppy? Take a 5 minute break. Short daily sessions beat long ones.",
];

/**
 * One touch typing tip based on the last lesson.
 * Accuracy comes first: speed follows clean habits, not the other way round.
 */
export function coachTip(
  last: Result | undefined,
  count: number,
  {
    stageUp = null,
    sessionMinutes = 0,
  }: {
    /** Set right after reaching a new stage: its name and what it unlocks. */
    readonly stageUp?: {
      readonly name: string;
      readonly unlocks: string;
    } | null;
    readonly sessionMinutes?: number;
  } = {},
): string {
  if (stageUp != null) {
    return `New stage: ${stageUp.name}! Unlocked: ${stageUp.unlocks}.`;
  }
  if (sessionMinutes >= 15) {
    return `${Math.round(sessionMinutes)} minutes of typing this session. Take a short break, practice sticks better in short sessions.`;
  }
  if (last == null) {
    return "Start slow. Fingers on the home keys (feel the bumps on F and J), thumbs on the thumb keys.";
  }
  if (last.accuracy < 0.9) {
    return `${pct(last.accuracy)} accuracy. Slow way down until you almost never miss. Speed comes later.`;
  }
  if (last.accuracy < 0.96) {
    return `${pct(last.accuracy)} accuracy. Aim for 96%+ before chasing speed. Type at a steady rhythm, not in bursts.`;
  }
  return `${pct(last.accuracy)} accuracy, nice. ${habits[count % habits.length]}`;
}

function pct(n: number): string {
  return `${Math.floor(n * 100)}%`;
}

/**
 * Rates a lesson from 1 to 5 stars. Accuracy earns the first stars,
 * speed only counts once the typing is clean.
 */
export function lessonStars(result: Result, targetSpeed: number): number {
  const { accuracy, speed } = result;
  if (accuracy < 0.9) {
    return 1;
  }
  if (accuracy < 0.96) {
    return 2;
  }
  if (accuracy < 0.98 || speed < targetSpeed * 0.6) {
    return 3;
  }
  return speed < targetSpeed ? 4 : 5;
}

/**
 * The pace to chase, in characters per minute: a bit faster than
 * the recent average, the push that gets past a plateau.
 * Returns zero until there are results to go by.
 */
export function paceSpeed(results: readonly Result[]): number {
  const recent = results.slice(-10);
  if (recent.length === 0) {
    return 0;
  }
  const average =
    recent.reduce((sum, { speed }) => sum + speed, 0) / recent.length;
  return average * 1.1;
}
