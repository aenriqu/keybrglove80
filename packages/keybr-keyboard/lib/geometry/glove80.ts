import { type GeometryDict, type LabelShape, type ZoneId } from "../types.ts";

/*
 * MoErgo Glove80, factory default keymap (base layer).
 *
 * Each half has six columns, a five key function row, a five key bottom row,
 * and a six key thumb cluster. Columns are staggered vertically to follow
 * the curved key wells. The right half is a mirror image of the left one.
 *
 * Key ids are the `KeyboardEvent.code` values the keyboard sends,
 * so that pressed keys light up on the virtual keyboard. The "Lower" and
 * "Magic" keys are handled in firmware and never reach the browser,
 * so they get made-up ids.
 */

type Hand = "left" | "right";

type KeyDef = {
  readonly id: string;
  readonly labels?: readonly LabelShape[];
};

/** Total width of the keyboard in key units. */
const width = 17.5;

/** Vertical offset of each column, from the outer pinky column inwards. */
const stagger = [0.5, 0.5, 0.25, 0, 0.2, 0.35] as const;

/** Finger zone of each column, from the outer pinky column inwards. */
const fingers = (hand: Hand): readonly ZoneId[] => [
  "pinky",
  "pinky",
  "ring",
  "middle",
  hand === "left" ? "leftIndex" : "rightIndex",
  hand === "left" ? "leftIndex" : "rightIndex",
];

/** Row zone of each row, from the function row downwards. */
const rows: readonly (ZoneId | null)[] = [
  null,
  "digit",
  "top",
  "home",
  "bottom",
  "bottom",
];

/** Thumb key positions, from the outer upper key inwards, then the lower row. */
const thumbs = [
  { x: 5.5, y: 5.6 },
  { x: 6.5, y: 5.85 },
  { x: 7.5, y: 6.2 },
  { x: 5.6, y: 6.65 },
  { x: 6.6, y: 6.9 },
  { x: 7.6, y: 7.25 },
] as const;

const word = (...lines: readonly string[]): readonly LabelShape[] =>
  lines.map((text, index) => ({
    text,
    pos: [5, 5 + index * 13],
    align: ["s", "t"],
  }));

const icon = (text: string): readonly LabelShape[] => [
  { text, pos: [19, 20], align: ["m", "m"] },
];

const k = (id: string, labels?: readonly LabelShape[]): KeyDef => ({
  id,
  labels,
});

/** Main block of the left half, rows top to bottom, columns outer to inner. */
const leftMain: readonly (readonly KeyDef[])[] = [
  [
    k("F1", word("F1")),
    k("F2", word("F2")),
    k("F3", word("F3")),
    k("F4", word("F4")),
    k("F5", word("F5")),
  ],
  [k("Equal"), k("Digit1"), k("Digit2"), k("Digit3"), k("Digit4"), k("Digit5")],
  [
    k("Tab", word("Tab")),
    k("KeyQ"),
    k("KeyW"),
    k("KeyE"),
    k("KeyR"),
    k("KeyT"),
  ],
  [
    k("Escape", word("Esc")),
    k("KeyA"),
    k("KeyS"),
    k("KeyD"),
    k("KeyF"),
    k("KeyG"),
  ],
  [k("Backquote"), k("KeyZ"), k("KeyX"), k("KeyC"), k("KeyV"), k("KeyB")],
  [
    k("Glove80Magic", word("Magic")),
    k("Home", word("Home")),
    k("End", word("End")),
    k("ArrowLeft", icon("←")),
    k("ArrowRight", icon("→")),
  ],
];

/** Main block of the right half, rows top to bottom, columns outer to inner. */
const rightMain: readonly (readonly KeyDef[])[] = [
  [
    k("F10", word("F10")),
    k("F9", word("F9")),
    k("F8", word("F8")),
    k("F7", word("F7")),
    k("F6", word("F6")),
  ],
  [k("Minus"), k("Digit0"), k("Digit9"), k("Digit8"), k("Digit7"), k("Digit6")],
  [k("Backslash"), k("KeyP"), k("KeyO"), k("KeyI"), k("KeyU"), k("KeyY")],
  [k("Quote"), k("Semicolon"), k("KeyL"), k("KeyK"), k("KeyJ"), k("KeyH")],
  [
    k("PageUp", word("Page", "Up")),
    k("Slash"),
    k("Period"),
    k("Comma"),
    k("KeyM"),
    k("KeyN"),
  ],
  [
    k("PageDown", word("Page", "Down")),
    k("BracketRight"),
    k("BracketLeft"),
    k("ArrowDown", icon("↓")),
    k("ArrowUp", icon("↑")),
  ],
];

export type Glove80Os = "windows" | "mac";

/** Thumb clusters, from the outer upper key inwards, then the lower row. */
function thumbKeys(os: Glove80Os): Record<Hand, readonly KeyDef[]> {
  if (os === "mac") {
    return {
      left: [
        k("ShiftLeft", word("Shift")),
        k("MetaLeft", word("Cmd")),
        k("Glove80Lower", word("Lower")),
        k("Backspace", word("Bksp")),
        k("Delete", word("Del")),
        k("AltLeft", word("Opt")),
      ],
      right: [
        k("ShiftRight", word("Shift")),
        k("MetaRight", word("Cmd")),
        k("ControlLeft", word("Ctrl")),
        k("Space", word("Space")),
        k("Enter", word("Enter")),
        k("AltRight", word("Opt")),
      ],
    };
  } else {
    return {
      left: [
        k("ShiftLeft", word("Shift")),
        k("ControlLeft", word("Ctrl")),
        k("Glove80Lower", word("Lower")),
        k("Backspace", word("Bksp")),
        k("Delete", word("Del")),
        k("AltLeft", word("Alt")),
      ],
      right: [
        k("ShiftRight", word("Shift")),
        k("ControlRight", word("Ctrl")),
        k("MetaLeft", word("Win")),
        k("Space", word("Space")),
        k("Enter", word("Enter")),
        k("AltRight", word("Alt")),
      ],
    };
  }
}

/** Mirrors a left-half x position onto the right half. */
function place(hand: Hand, x: number): number {
  return hand === "left" ? x : width - 1 - x;
}

function makeGlove80(os: Glove80Os): GeometryDict {
  const dict: Record<string, GeometryDict[string]> = {};
  const thumb = thumbKeys(os);
  for (const [hand, main] of [
    ["left", leftMain],
    ["right", rightMain],
  ] as const) {
    main.forEach((keys, row) => {
      keys.forEach(({ id, labels }, col) => {
        const zone = rows[row];
        dict[id] = {
          x: place(hand, col),
          y: row + stagger[col],
          labels,
          zones: [fingers(hand)[col], hand, ...(zone ? [zone] : [])],
          homing: id === "KeyF" || id === "KeyJ",
        };
      });
    });
    thumb[hand].forEach(({ id, labels }, index) => {
      const { x, y } = thumbs[index];
      dict[id] = {
        x: place(hand, x),
        y,
        labels,
        zones: ["thumb", hand, "bottom"],
      };
    });
  }
  return dict;
}

export const GLOVE80_WINDOWS: GeometryDict = makeGlove80("windows");

export const GLOVE80_MAC: GeometryDict = makeGlove80("mac");
