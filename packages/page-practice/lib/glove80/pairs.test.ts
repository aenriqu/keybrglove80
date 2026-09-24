import { test } from "node:test";
import { deepEqual, equal, isTrue } from "rich-assert";
import { drillText, letterWeakness, pickPairs } from "./pairs.ts";

test("starts with the first letters keybr teaches", () => {
  const weakness = letterWeakness([]);
  const pairs = pickPairs(weakness, new Set());
  equal(pairs.length, 5);
  for (const pair of pairs) {
    isTrue([...pair].every((letter) => "enitrlas".includes(letter)));
  }
});

test("weak letters come first, passed pairs are skipped", () => {
  const weakness = new Map([
    ["t", 0.1],
    ["h", 0.5],
    ["e", 0.1],
    ["i", 0.1],
    ["n", 0.1],
    ["a", 0.1],
  ]);
  deepEqual(pickPairs(weakness, new Set(), 2), ["th", "he"]);
  deepEqual(pickPairs(weakness, new Set(["th"]), 2), ["he", "ha"]);
});

test("drill text", () => {
  equal(drillText(["th", "he"]), "th th th he he he th he");
});
