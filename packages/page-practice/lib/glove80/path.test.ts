import { test } from "node:test";
import { ResultFaker } from "@keybr/result";
import { equal, isTrue } from "rich-assert";
import { pathStage, sessionMinutes, weekSummary } from "./path.ts";

const day = 24 * 60 * 60 * 1000;

test("stages escalate and never demote", () => {
  const faker = new ResultFaker();
  equal(pathStage([], {}).index, 0);
  const clean = Array.from({ length: 5 }, () =>
    faker.nextResult({ length: 100, errors: 2 }),
  );
  // The faker histogram holds only a few letters, so stage 2 is next.
  equal(pathStage(clean, {}).index, 1);
  // A sloppy streak after reaching stage 2 does not send you back.
  const sloppy = Array.from({ length: 5 }, () =>
    faker.nextResult({ length: 100, errors: 30 }),
  );
  equal(pathStage(sloppy, {}).index, 0);
  equal(pathStage(sloppy, {}, 1).index, 1);
  // Stage 4 passes with both drills at 96%.
  equal(pathStage(clean, { numbers: 96, symbols: 97 }, 3).index, 4);
  equal(pathStage(clean, { numbers: 96 }, 3).index, 3);
});

test("weekly verdict", () => {
  const faker = new ResultFaker();
  const now = 30 * day;
  const at = (timeStamp: number, errors: number) =>
    faker.nextResult({ timeStamp, length: 100, errors });
  isTrue(weekSummary([], now).verdict.startsWith("No lessons"));
  isTrue(weekSummary([at(now - day, 1)], now).verdict.includes("on track"));
  const better = weekSummary([at(now - 8 * day, 10), at(now - day, 2)], now);
  isTrue(better.verdict.includes("Improving"));
  const worse = weekSummary([at(now - 8 * day, 2), at(now - day, 10)], now);
  isTrue(worse.verdict.includes("slipped"));
});

test("session minutes", () => {
  const faker = new ResultFaker();
  const now = 10 * day;
  const minute = 60 * 1000;
  const list = [
    faker.nextResult({ timeStamp: now - 90 * minute, time: 5 * minute }),
    faker.nextResult({ timeStamp: now - 10 * minute, time: 5 * minute }),
    faker.nextResult({ timeStamp: now - minute, time: 5 * minute }),
  ];
  equal(sessionMinutes(list, now), 10);
  equal(sessionMinutes(list, now + 60 * minute), 0);
});
