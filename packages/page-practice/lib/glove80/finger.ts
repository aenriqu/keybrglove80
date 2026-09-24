import { type Keyboard, type KeyShape } from "@keybr/keyboard";
import { type CodePoint } from "@keybr/unicode";

export type FingerHint = {
  /** The character to type, as shown to the user. */
  readonly char: string;
  /** Which finger, e.g. "left index". */
  readonly finger: string;
  /** How to get there from the home position. */
  readonly move: string;
};

const fingerNames: Record<string, string> = {
  pinky: "pinky",
  ring: "ring",
  middle: "middle",
  leftIndex: "index",
  rightIndex: "index",
  thumb: "thumb",
};

/** Tells which finger types the given character and how to reach it. */
export function fingerHint(
  keyboard: Keyboard,
  codePoint: CodePoint,
): FingerHint | null {
  const combo = keyboard.getCombo(codePoint);
  const shape = combo != null ? keyboard.getShape(combo.id) : null;
  if (combo == null || shape == null || shape.finger == null) {
    return null;
  }
  const char = codePoint === 0x0020 ? "Space" : String.fromCodePoint(codePoint);
  const finger = `${shape.hand ?? ""} ${fingerNames[shape.finger]}`.trim();
  const shift = combo.shift
    ? `, hold Shift with the ${shape.hand === "left" ? "right" : "left"} hand`
    : "";
  if (shape.finger === "thumb") {
    return { char, finger, move: `thumb key${shift}` };
  }
  const home = homeKey(keyboard, shape);
  const from = home != null && home !== shape ? keyLabel(home) : null;
  const sideways = from != null && Math.abs(shape.x - home!.x) > 0.5;
  const vertical =
    shape.row === "top"
      ? "up"
      : shape.row === "digit"
        ? "up two rows"
        : shape.row === "bottom"
          ? "down"
          : null;
  let move: string;
  if (from == null) {
    move = "home key, just press";
  } else if (vertical != null && sideways) {
    move = `reach ${vertical} and sideways from ${from}`;
  } else if (vertical != null) {
    move = `reach ${vertical} from ${from}`;
  } else {
    move = `slide sideways from ${from}`;
  }
  return { char, finger, move: move + shift };
}

/** The key this finger rests on in the home position. */
function homeKey(keyboard: Keyboard, shape: KeyShape): KeyShape | null {
  const row = sameFinger(keyboard, shape).filter((s) => s.row === "home");
  const homing = row.find((s) => s.homing);
  if (homing != null) {
    return homing;
  }
  // Pinkies have two home row keys, the inner one is home.
  return (
    row.sort((a, b) => (shape.hand === "left" ? b.x - a.x : a.x - b.x))[0] ??
    null
  );
}

function sameFinger(keyboard: Keyboard, shape: KeyShape): KeyShape[] {
  return [...keyboard.shapes.values()].filter(
    (s) => s.finger === shape.finger && s.hand === shape.hand,
  );
}

function keyLabel(shape: KeyShape): string {
  const a = shape.a;
  return typeof a === "number"
    ? String.fromCodePoint(a).toUpperCase()
    : shape.id;
}

export type FingerStat = {
  /** E.g. "left pinky". */
  readonly finger: string;
  /** Letters this finger types. */
  readonly letters: string;
  readonly hits: number;
  readonly misses: number;
  /** From 0 to 1. */
  readonly accuracy: number;
  /** Average time per key in milliseconds. */
  readonly time: number;
};

const fingerOrder = [
  "left pinky",
  "left ring",
  "left middle",
  "left index",
  "right index",
  "right middle",
  "right ring",
  "right pinky",
];

/** Recent accuracy and speed per finger, from the per-key lesson stats. */
export function fingerStats(
  keyboard: Keyboard,
  results: readonly {
    readonly histogram: Iterable<{
      readonly codePoint: CodePoint;
      readonly hitCount: number;
      readonly missCount: number;
      readonly timeToType: number;
    }>;
  }[],
): FingerStat[] {
  const sums = new Map(
    fingerOrder.map((finger) => [
      finger,
      { letters: new Set<string>(), hits: 0, misses: 0, time: 0 },
    ]),
  );
  for (const { histogram } of results.slice(-20)) {
    for (const { codePoint, hitCount, missCount, timeToType } of histogram) {
      const hint = fingerHint(keyboard, codePoint);
      const sum = hint != null ? sums.get(hint.finger) : undefined;
      if (sum != null) {
        sum.letters.add(hint!.char.toLowerCase());
        sum.hits += hitCount;
        sum.misses += missCount;
        sum.time += timeToType * hitCount;
      }
    }
  }
  return fingerOrder.map((finger) => {
    const { letters, hits, misses, time } = sums.get(finger)!;
    return {
      finger,
      letters: [...letters].sort().join(""),
      hits,
      misses,
      accuracy: hits + misses > 0 ? hits / (hits + misses) : 1,
      time: hits > 0 ? time / hits : 0,
    };
  });
}

/** The finger that needs the most work, once there is enough data. */
export function weakestFinger(stats: readonly FingerStat[]): FingerStat | null {
  const known = stats.filter(({ hits, misses }) => hits + misses >= 30);
  if (known.length === 0) {
    return null;
  }
  // Misses count most, slowness breaks ties.
  const cost = ({ accuracy, time }: FingerStat) =>
    (1 - accuracy) * 10 + time / 1000;
  return known.reduce((a, b) => (cost(b) > cost(a) ? b : a));
}
