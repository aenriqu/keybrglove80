import { KeyboardProvider, type KeyId, useKeyboard } from "@keybr/keyboard";
import { KeyLayer, TargetLayer, VirtualKeyboard } from "@keybr/keyboard-ui";
import { Screen } from "@keybr/pages-shared";
import { useResults } from "@keybr/result";
import { Button, Icon, useView, useWindowEvent, Zoomer } from "@keybr/widget";
import { mdiArrowLeft, mdiLock, mdiPlay } from "@mdi/js";
import { clsx } from "clsx";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { views } from "../views.tsx";
import { Buddy } from "./Buddy.tsx";
import * as coach from "./Coach.module.less";
import { fingerStats, weakestFinger } from "./finger.ts";
import { FingerHint } from "./FingerHint.tsx";
import { OsToggle } from "./OsToggle.tsx";
import {
  drillText,
  focusOn,
  letterWeakness,
  numbersText,
  pickPairs,
  symbolsText,
} from "./pairs.ts";
import { drillPass, stages } from "./path.ts";
import * as styles from "./QuestScreen.module.less";
import { saveRound, useQuestRecord } from "./store.ts";
import { usePath } from "./usePath.ts";

type Mode = "pairs" | "numbers" | "symbols";

const modes: readonly {
  readonly id: Mode;
  readonly name: string;
  /** The path stage that unlocks the mode. */
  readonly stage: number;
}[] = [
  { id: "pairs", name: "Letter Pairs", stage: 0 },
  { id: "numbers", name: "Numbers", stage: 3 },
  { id: "symbols", name: "Symbols", stage: 3 },
];

type Round = {
  readonly mode: Mode;
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

const newRound = (mode: Mode, pairs: readonly string[]): Round => ({
  mode,
  pairs,
  text:
    mode === "numbers"
      ? numbersText()
      : mode === "symbols"
        ? symbolsText()
        : drillText(pairs),
  pos: 0,
  errors: 0,
  missed: false,
  startedAt: null,
  done: null,
});

export function DrillsScreen(): ReactNode {
  return (
    <KeyboardProvider>
      <Drills />
    </KeyboardProvider>
  );
}

function Drills(): ReactNode {
  const { setView } = useView(views);
  const keyboard = useKeyboard();
  const { results } = useResults();
  const { best } = useQuestRecord();
  const path = usePath();
  const focus = useMemo(
    () => weakestFinger(fingerStats(keyboard, results)),
    [keyboard, results],
  );
  const weakness = useMemo(
    () => focusOn(letterWeakness(results), focus?.letters ?? ""),
    [results, focus],
  );
  const [passed, setPassed] = useState<ReadonlySet<string>>(new Set());
  const [round, setRoundState] = useState(() =>
    newRound("pairs", pickPairs(weakness, passed)),
  );
  // Fast key presses can arrive before a re-render, so read the latest
  // round from a ref rather than from the render closure.
  const roundRef = useRef(round);
  const setRound = (next: Round) => {
    roundRef.current = next;
    setRoundState(next);
  };
  const [pressed, setPressed] = useState<readonly KeyId[]>([]);

  const start = (mode: Mode) => {
    (document.activeElement as HTMLElement | null)?.blur();
    setRound(newRound(mode, pickPairs(weakness, passed)));
  };

  const next = () => {
    const round = roundRef.current;
    if (round.mode !== "pairs") {
      setRound(newRound(round.mode, []));
    } else if (round.done?.pass) {
      const nextPassed = new Set([...passed, ...round.pairs]);
      setPassed(nextPassed);
      setRound(newRound("pairs", pickPairs(weakness, nextPassed)));
    } else {
      setRound(newRound("pairs", round.pairs));
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
    const now = event.timeStamp;
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
    const pass = accuracy >= drillPass;
    saveRound(round.mode, Math.floor(accuracy * 100), pass ? 15 : 5);
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
        <h1 className={styles.title}>Drills</h1>
        <OsToggle />
      </div>
      <Buddy compact={true} />
      <div className={styles.play}>
        <div className={styles.groups}>
          {modes.map((mode) => {
            const locked = path.index < mode.stage;
            return (
              <button
                key={mode.id}
                type="button"
                className={clsx(
                  styles.group,
                  mode.id === round.mode && styles.active,
                )}
                disabled={locked}
                title={
                  locked
                    ? `Unlocks at stage ${mode.stage + 1}: ${stages[mode.stage].name}`
                    : undefined
                }
                onClick={() => start(mode.id)}
              >
                <span className={styles.groupName}>
                  {locked && <Icon shape={mdiLock} />} {mode.name}
                </span>
                <span className={styles.groupBest}>
                  {locked
                    ? `unlocks at stage ${mode.stage + 1}`
                    : `best ${best[mode.id] ?? 0}%`}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.progress}>
          {round.mode === "pairs"
            ? `Pairs: ${round.pairs.join(" ")}${focus != null ? ` · focus: ${focus.finger}` : ""} · ${passed.size} passed`
            : `Pass at ${Math.round(drillPass * 100)}% accuracy`}
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
              label={
                !round.done.pass
                  ? "Again (Enter)"
                  : round.mode === "pairs"
                    ? "New pairs (Enter)"
                    : "Next round (Enter)"
              }
              onClick={next}
            />
          </>
        )}
      </div>
      <div className={styles.keyboard}>
        <Zoomer id="Keyboard/Drills">
          <VirtualKeyboard keyboard={keyboard} height="32rem">
            <KeyLayer depressedKeys={pressed} showColors={true} />
            <TargetLayer targets={target != null ? [target] : []} />
          </VirtualKeyboard>
        </Zoomer>
      </div>
    </Screen>
  );
}
