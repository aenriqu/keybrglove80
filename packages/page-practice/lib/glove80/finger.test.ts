import { test } from "node:test";
import { Geometry, Layout, loadKeyboard } from "@keybr/keyboard";
import { deepEqual, isNull } from "rich-assert";
import { fingerHint } from "./finger.ts";

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
