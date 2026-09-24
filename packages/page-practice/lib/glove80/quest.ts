import { Geometry, type KeyId } from "@keybr/keyboard";

export type Group = {
  readonly id: string;
  readonly name: string;
  readonly keys: readonly KeyId[];
};

export const groups: readonly Group[] = [
  {
    id: "thumbs",
    name: "Thumbs",
    keys: [
      "Space",
      "Backspace",
      "Enter",
      "Delete",
      "ShiftLeft",
      "ShiftRight",
      "ControlLeft",
      "ControlRight",
      "MetaLeft",
      "MetaRight",
      "AltLeft",
      "AltRight",
    ],
  },
  {
    id: "edges",
    name: "Edges",
    keys: [
      "Escape",
      "Tab",
      "Backquote",
      "Equal",
      "Minus",
      "Backslash",
      "Quote",
      "Semicolon",
      "Slash",
      "BracketLeft",
      "BracketRight",
    ],
  },
  {
    id: "nav",
    name: "Nav",
    keys: [
      "Home",
      "End",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
    ],
  },
  {
    id: "all",
    name: "All",
    keys: [],
  },
];

/** Keys that the operating system grabs, so they cannot be drilled. */
function blocked(geometry: Geometry): readonly KeyId[] {
  return geometry === Geometry.GLOVE80_MAC ? [] : ["MetaLeft", "MetaRight"];
}

/** Returns the keys of a group which exist on the given keyboard. */
export function groupKeys(
  group: Group,
  geometry: Geometry,
  has: (id: KeyId) => boolean,
): KeyId[] {
  const ids =
    group.id === "all" ? groups.flatMap((item) => item.keys) : [...group.keys];
  const skip = blocked(geometry);
  return ids.filter((id) => has(id) && !skip.includes(id));
}

export function keyName(id: KeyId, geometry: Geometry): string {
  const mac = geometry === Geometry.GLOVE80_MAC;
  switch (id) {
    case "ShiftLeft":
      return "Left Shift";
    case "ShiftRight":
      return "Right Shift";
    case "ControlLeft":
      return mac ? "Ctrl" : "Left Ctrl";
    case "ControlRight":
      return "Right Ctrl";
    case "MetaLeft":
      return mac ? "Left Cmd" : "Win";
    case "MetaRight":
      return "Right Cmd";
    case "AltLeft":
      return mac ? "Left Opt" : "Left Alt";
    case "AltRight":
      return mac ? "Right Opt" : "Right Alt";
    case "Escape":
      return "Esc";
    case "Backquote":
      return "`";
    case "Equal":
      return "=";
    case "Minus":
      return "-";
    case "Backslash":
      return "\\";
    case "Quote":
      return "'";
    case "Semicolon":
      return ";";
    case "Slash":
      return "/";
    case "BracketLeft":
      return "[";
    case "BracketRight":
      return "]";
    case "ArrowLeft":
      return "←";
    case "ArrowRight":
      return "→";
    case "ArrowUp":
      return "↑";
    case "ArrowDown":
      return "↓";
    case "PageUp":
      return "Page Up";
    case "PageDown":
      return "Page Down";
    default:
      return id.replace(/^(Key|Digit)/, "");
  }
}

export const roundLength = 20;

/** Picks the prompts for a round, never repeating the same key twice in a row. */
export function makeRound(
  keys: readonly KeyId[],
  random: () => number = Math.random,
): KeyId[] {
  const list: KeyId[] = [];
  while (list.length < roundLength && keys.length > 0) {
    const id = keys[Math.floor(random() * keys.length)];
    if (keys.length === 1 || id !== list.at(-1)) {
      list.push(id);
    }
  }
  return list;
}

export type Answer = {
  readonly id: KeyId;
  readonly hit: boolean;
  readonly time: number;
};

export type Summary = {
  readonly hits: number;
  readonly total: number;
  readonly avgTime: number;
  readonly score: number;
  readonly xp: number;
};

export function summarize(answers: readonly Answer[], blind: boolean): Summary {
  const total = answers.length;
  const hits = answers.filter((a) => a.hit).length;
  const avgTime =
    total > 0 ? answers.reduce((sum, a) => sum + a.time, 0) / total : 0;
  let score = 0;
  for (const { hit, time } of answers) {
    if (hit) {
      score += 100 + Math.max(0, Math.round((2000 - time) / 20));
    }
  }
  if (blind) {
    score = Math.round(score * 1.5);
  }
  const perfect = total > 0 && hits === total ? 20 : 0;
  const xp = hits * (blind ? 4 : 2) + perfect;
  return { hits, total, avgTime, score, xp };
}
