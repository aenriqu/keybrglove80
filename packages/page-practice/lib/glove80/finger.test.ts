import { test } from "node:test";
import { Geometry, Layout, loadKeyboard } from "@keybr/keyboard";
import { deepEqual, equal, isNull } from "rich-assert";
import { fingerHint, fingerStats, weakestFinger } from "./finger.ts";

const hint = (char: string) =>
  fingerHint(
    loadKeyboard(Layout.EN_US, Geometry.GLOVE80_WINDOWS),
    char.codePointAt(0)!,
  );

test("finger hints on the Glove80", () => {
  deepEqual(hint("f"), {
    char: "f",
    finger: "left index",
    move: "home key, just press",
  });
  deepEqual(hint("e"), {
    char: "e",
    finger: "left middle",
    move: "reach up from D",
  });
  deepEqual(hint("g"), {
    char: "g",
    finger: "left index",
    move: "slide sideways from F",
  });
  deepEqual(hint("b"), {
    char: "b",
    finger: "left index",
    move: "reach down and sideways from F",
  });
  deepEqual(hint("a"), {
    char: "a",
    finger: "left pinky",
    move: "home key, just press",
  });
  deepEqual(hint("P"), {
    char: "P",
    finger: "right pinky",
    move: "reach up from ;, hold Shift with the left hand",
  });
  deepEqual(hint(" ")?.finger, "right thumb");
  isNull(hint("\u{1F600}"));
});

test("finger report", () => {
  const keyboard = loadKeyboard(Layout.EN_US, Geometry.GLOVE80_WINDOWS);
  const sample = (char: string, hitCount: number, missCount: number) => ({
    codePoint: char.codePointAt(0)!,
    hitCount,
    missCount,
    timeToType: 300,
  });
  const stats = fingerStats(keyboard, [
    {
      histogram: [sample("a", 20, 20), sample("f", 50, 0), sample("j", 50, 1)],
    },
  ]);
  equal(stats.length, 8);
  const pinky = stats.find(({ finger }) => finger === "left pinky")!;
  equal(pinky.accuracy, 0.5);
  equal(pinky.letters, "a");
  equal(weakestFinger(stats)?.finger, "left pinky");
  isNull(weakestFinger(fingerStats(keyboard, [])));
});
