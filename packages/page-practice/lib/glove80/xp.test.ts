import { test } from "node:test";
import { ResultFaker } from "@keybr/result";
import { equal } from "rich-assert";
import {
  buddyState,
  dayOf,
  lessonXp,
  levelOf,
  stageOf,
  streakOf,
  xpToReach,
} from "./xp.ts";

const day = 24 * 60 * 60 * 1000;

test("levels", () => {
  equal(xpToReach(1), 0);
  equal(xpToReach(2), 100);
  equal(xpToReach(3), 300);
  equal(levelOf(0), 1);
  equal(levelOf(99), 1);
  equal(levelOf(100), 2);
  equal(levelOf(299), 2);
  equal(levelOf(300), 3);
});

test("stages", () => {
  equal(stageOf(1), 0);
  equal(stageOf(2), 0);
  equal(stageOf(3), 1);
  equal(stageOf(9), 2);
  equal(stageOf(10), 3);
  equal(stageOf(100), 5);
});

test("lesson xp", () => {
  const faker = new ResultFaker();
  equal(lessonXp(faker.nextResult({ length: 100, errors: 0 })), 30);
  equal(lessonXp(faker.nextResult({ length: 100, errors: 20 })), 13);
});

test("streak", () => {
  const now = new Date(2001, 1, 10, 12).getTime();
  equal(streakOf([], now), 0);
  equal(streakOf([now], now), 1);
  equal(streakOf([now - day, now - 2 * day], now), 2);
  equal(streakOf([now, now - day, now - 3 * day], now), 2);
  equal(streakOf([now - 2 * day], now), 0);
  equal(dayOf(now) - dayOf(now - day), 1);
});

test("buddy state", () => {
  const now = new Date(2001, 1, 10, 12).getTime();
  const faker = new ResultFaker({ timeStamp: now - 60000 });
  const results = [
    faker.nextResult({ length: 100, errors: 0 }),
    faker.nextResult({ length: 100, errors: 0 }),
    faker.nextResult({ length: 100, errors: 0 }),
    faker.nextResult({ length: 100, errors: 0 }),
  ];
  const state = buddyState(results, 5, [], now);
  equal(state.xp, 125);
  equal(state.level, 2);
  equal(state.levelXp, 25);
  equal(state.levelSize, 200);
  equal(state.streak, 1);
  equal(state.today, true);
  equal(state.mood, "happy");
  equal(buddyState([], 0, [], now).mood, "sleepy");
});
