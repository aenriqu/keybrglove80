import { test } from "node:test";
import { ResultFaker } from "@keybr/result";
import { equal, isTrue } from "rich-assert";
import { coachTip, lessonStars, paceSpeed } from "./coach.ts";

test("coach puts accuracy first", () => {
  const faker = new ResultFaker();
  isTrue(coachTip(undefined, 0).includes("home keys"));
  isTrue(
    coachTip(faker.nextResult({ length: 100, errors: 20 }), 0).includes(
      "Slow way down",
    ),
  );
  isTrue(
    coachTip(faker.nextResult({ length: 100, errors: 6 }), 0).includes("96%+"),
  );
  isTrue(
    coachTip(faker.nextResult({ length: 100, errors: 1 }), 0).includes("nice"),
  );
});

test("stars reward accuracy before speed", () => {
  const faker = new ResultFaker();
  // 100 chars in 50 s is 120 cpm.
  const stars = (errors: number, target: number) =>
    lessonStars(faker.nextResult({ length: 100, time: 50000, errors }), target);
  equal(stars(20, 100), 1);
  equal(stars(6, 100), 2);
  equal(stars(3, 100), 3);
  equal(stars(0, 300), 3);
  equal(stars(0, 150), 4);
  equal(stars(0, 100), 5);
});

test("pace is 10% above the recent average", () => {
  const faker = new ResultFaker();
  equal(paceSpeed([]), 0);
  equal(
    Math.round(paceSpeed([faker.nextResult({ length: 100, time: 60000 })])),
    110,
  );
});

test("stage ups and breaks come first", () => {
  isTrue(
    coachTip(undefined, 0, {
      stageUp: { name: "Build speed", unlocks: "The pace line" },
    }).startsWith("New stage: Build speed"),
  );
  isTrue(coachTip(undefined, 0, { sessionMinutes: 16 }).includes("break"));
});
