import { KeyboardProvider, type KeyId, useKeyboard } from "@keybr/keyboard";
import { KeyLayer, TargetLayer, VirtualKeyboard } from "@keybr/keyboard-ui";
import { Screen } from "@keybr/pages-shared";
import { useResults } from "@keybr/result";
import { Button, Icon, useView, useWindowEvent, Zoomer } from "@keybr/widget";
import { mdiArrowLeft, mdiPlay } from "@mdi/js";
import { clsx } from "clsx";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { views } from "../views.tsx";
import { Buddy } from "./Buddy.tsx";
import * as coach from "./Coach.module.less";
import { FingerHint } from "./FingerHint.tsx";
import { OsToggle } from "./OsToggle.tsx";
import { drillText, letterWeakness, passAccuracy, pickPairs } from "./pairs.ts";
import * as styles from "./QuestScreen.module.less";
import { saveRound } from "./store.ts";

type Round = {
  readonly pairs: readonly string[];
  readonly text: string;
  readonly pos: number;
  readonly errors: number;
  readonly missed: boolean;
  readonly startedAt: number | null;
  readonly done: {
    readonly accuracy: number;
    readonly wpm: number;
    readonly pass: boolean;
  } | null;
};

const newRound = (pairs: readonly string[]): Round => ({
  pairs,
  text: drillText(pairs),
  pos: 0,
  errors: 0,
  missed: false,
  startedAt: null,
  done: null,
});

export function PairsScreen(): ReactNode {
  return (
    <KeyboardProvider>
      <Pairs />
    </KeyboardProvider>
  );
}

function Pairs(): ReactNode {
  const { setView } = useView(views);
  const keyboard = useKeyboard();
  const { results } = useResults();
  const weakness = useMemo(() => letterWeakness(results), [results]);
  const [passed, setPassed] = useState<ReadonlySet<string>>(new Set());
  const [round, setRoundState] = useState(() =>
    newRound(pickPairs(weakness, passed)),
  );
  // Fast key presses can arrive before a re-render, so read the latest
  // round from a ref rather than from the render closure.
  const roundRef = useRef(round);
  const setRound = (next: Round) => {
    roundRef.current = next;
    setRoundState(next);
  };
  const [pressed, setPressed] = useState<readonly KeyId[]>([]);

  const next = () => {
    const round = roundRef.current;
    if (round.done?.pass) {
      const nextPassed = new Set([...passed, ...round.pairs]);
      setPassed(nextPassed);
      setRound(newRound(pickPairs(weakness, nextPassed)));
    } else {
      setRound(newRound(round.pairs));
    }
  };

  useWindowEvent("keydown", (event) => {
    const round = roundRef.current;
    setPressed((list) =>
      list.includes(event.code) ? list : [...list, event.code],
    );
    if (round.done != null) {
      // Only Enter, a habitual space after the last word must not skip the results.
      if (event.code === "Enter") {
        event.preventDefault();
        next();
      }
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const now = performance.now();
    if (event.key !== round.text[round.pos]) {
      setRound({
        ...round,
        errors: round.missed ? round.errors : round.errors + 1,
        missed: true,
      });
      return;
    }
    const pos = round.pos + 1;
    const startedAt = round.startedAt ?? now;
    if (pos < round.text.length) {
      setRound({ ...round, pos, missed: false, startedAt });
      return;
    }
    const length = round.text.length;
    const accuracy = (length - round.errors) / length;
    const minutes = Math.max(now - startedAt, 1) / 60000;
    const pass = accuracy >= passAccuracy;
    saveRound("pairs", Math.round(accuracy * 100), pass ? 15 : 5);
    setRound({
      ...round,
      pos,
      missed: false,
      done: { accuracy, wpm: length / 5 / minutes, pass },
    });
  });

  useWindowEvent("keyup", (event) => {
    setPressed((list) => list.filter((code) => code !== event.code));
  });

  useWindowEvent("blur", () => {
    setPressed([]);
  });

  const nextChar = round.done == null ? round.text[round.pos] : null;
  const codePoint = nextChar != null ? nextChar.codePointAt(0)! : null;
  const target =
    codePoint != null ? (keyboard.getCombo(codePoint)?.id ?? null) : null;

  return (
    <Screen>
      <div className={styles.header}>
        <Button
          icon={<Icon shape={mdiArrowLeft} />}
          label="Practice"
          onClick={() => setView("practice")}
        />
        <h1 className={styles.title}>Letter Pairs</h1>
        <OsToggle />
      </div>
      <Buddy compact={true} />
      <div className={styles.play}>
        <div className={styles.progress}>
          Pairs: {round.pairs.join(" ")} · pass at{" "}
          {Math.round(passAccuracy * 100)}% accuracy · {passed.size} passed
        </div>
        {round.done == null ? (
          <>
            <div className={coach.drill}>
              <span className={coach.typed}>
                {round.text.slice(0, round.pos)}
              </span>
              <span
                className={clsx(coach.current, round.missed && coach.missed)}
              >
                {nextChar === " " ? "␣" : nextChar}
              </span>
              <span>{round.text.slice(round.pos + 1)}</span>
            </div>
            <FingerHint codePoint={codePoint} missed={round.missed} />
          </>
        ) : (
          <>
            <div
              className={clsx(styles.score, !round.done.pass && coach.missed)}
            >
              {Math.floor(round.done.accuracy * 100)}%
            </div>
            <div className={styles.stats}>
              <span>{round.done.pass ? "Passed" : "Not yet, go slower"}</span>
              <span>{Math.round(round.done.wpm)} wpm</span>
              <span>+{round.done.pass ? 15 : 5} XP</span>
            </div>
            <Button
              icon={<Icon shape={mdiPlay} />}
              label={round.done.pass ? "New pairs (Enter)" : "Again (Enter)"}
              onClick={next}
            />
          </>
        )}
      </div>
      <div className={styles.keyboard}>
        <Zoomer id="Keyboard/Pairs">
          <VirtualKeyboard keyboard={keyboard} height="32rem">
            <KeyLayer depressedKeys={pressed} showColors={true} />
            <TargetLayer targets={target != null ? [target] : []} />
          </VirtualKeyboard>
        </Zoomer>
      </div>
    </Screen>
  );
}
