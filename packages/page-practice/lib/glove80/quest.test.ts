import { test } from "node:test";
import { Geometry, Layout, loadKeyboard } from "@keybr/keyboard";
import { equal, isFalse, isTrue } from "rich-assert";
import { groupKeys, groups, keyName, makeRound, summarize } from "./quest.ts";

test("group keys exist on both keyboards", () => {
  for (const geometry of [Geometry.GLOVE80_WINDOWS, Geometry.GLOVE80_MAC]) {
    const keyboard = loadKeyboard(Layout.EN_US, geometry);
    for (const group of groups) {
      const keys = groupKeys(group, geometry, (id) => keyboard.shapes.has(id));
      isTrue(keys.length > 0);
      for (const id of keys) {
        isTrue(keyboard.shapes.has(id));
      }
    }
  }
});

test("skip the windows key", () => {
  const keyboard = loadKeyboard(Layout.EN_US, Geometry.GLOVE80_WINDOWS);
  const has = (id: string) => keyboard.shapes.has(id);
  const [thumbs] = groups;
  isFalse(
    groupKeys(thumbs, Geometry.GLOVE80_WINDOWS, has).includes("MetaLeft"),
  );
  isTrue(groupKeys(thumbs, Geometry.GLOVE80_MAC, has).includes("MetaLeft"));
});

test("key names", () => {
  equal(keyName("AltLeft", Geometry.GLOVE80_WINDOWS), "Left Alt");
  equal(keyName("AltLeft", Geometry.GLOVE80_MAC), "Left Opt");
  equal(keyName("BracketLeft", Geometry.GLOVE80_MAC), "[");
  equal(keyName("Enter", Geometry.GLOVE80_MAC), "Enter");
  equal(keyName("KeyA", Geometry.GLOVE80_MAC), "A");
  equal(keyName("Digit7", Geometry.GLOVE80_MAC), "7");
});

test("make round", () => {
  const round = makeRound(["A", "B", "C"]);
  equal(round.length, 20);
  for (let i = 1; i < round.length; i++) {
    isTrue(round[i] !== round[i - 1]);
  }
  equal(makeRound(["A"]).length, 20);
  equal(makeRound([]).length, 0);
});

test("summarize", () => {
  const summary = summarize(
    [
      { id: "A", hit: true, time: 1000 },
      { id: "B", hit: false, time: 3000 },
    ],
    false,
  );
  equal(summary.hits, 1);
  equal(summary.total, 2);
  equal(summary.avgTime, 2000);
  equal(summary.score, 150);
  equal(summary.xp, 2);
  equal(summarize([{ id: "A", hit: true, time: 3000 }], true).score, 150);
  equal(summarize([{ id: "A", hit: true, time: 3000 }], true).xp, 24);
});
