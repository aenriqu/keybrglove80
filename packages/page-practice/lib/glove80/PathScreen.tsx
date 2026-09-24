import { KeyboardProvider, useKeyboard } from "@keybr/keyboard";
import { Screen } from "@keybr/pages-shared";
import { useResults } from "@keybr/result";
import { Button, Icon, useView } from "@keybr/widget";
import { mdiArrowLeft, mdiPlay } from "@mdi/js";
import { clsx } from "clsx";
import { type ReactNode, useMemo, useState } from "react";
import { views } from "../views.tsx";
import { Buddy } from "./Buddy.tsx";
import { fingerStats, weakestFinger } from "./finger.ts";
import * as styles from "./Path.module.less";
import { stages, weekSummary } from "./path.ts";
import * as quest from "./QuestScreen.module.less";
import { usePath } from "./usePath.ts";

export function PathScreen(): ReactNode {
  return (
    <KeyboardProvider>
      <Path />
    </KeyboardProvider>
  );
}

/** The whole learning path, this week's check-in, and the finger report. */
function Path(): ReactNode {
  const { setView } = useView(views);
  const keyboard = useKeyboard();
  const { results } = useResults();
  const path = usePath();
  const [now] = useState(() => Date.now());
  const week = useMemo(() => weekSummary(results, now), [results, now]);
  const fingers = useMemo(
    () => fingerStats(keyboard, results),
    [keyboard, results],
  );
  const weakest = weakestFinger(fingers);
  const slowest = Math.max(1, ...fingers.map(({ time }) => time));
  return (
    <Screen>
      <div className={quest.header}>
        <Button
          icon={<Icon shape={mdiArrowLeft} />}
          label="Practice"
          onClick={() => setView("practice")}
        />
        <h1 className={quest.title}>Your Path</h1>
      </div>
      <Buddy compact={true} />

      <section className={styles.section}>
        <ol className={styles.stages}>
          {stages.map((stage, index) => {
            const done = index < path.index || path.index === 4;
            const current = index === path.index && !done;
            return (
              <li
                key={stage.name}
                className={clsx(
                  styles.stage,
                  done && styles.done,
                  current && styles.current,
                )}
              >
                <span className={styles.mark}>{done ? "✓" : index + 1}</span>
                <span className={styles.name}>{stage.name}</span>
                <span className={styles.small}>
                  {current
                    ? `Goal: ${stage.goal}`
                    : `Unlocks: ${stage.unlocks}`}
                </span>
                {current && (
                  <>
                    <span>
                      <span className={styles.small}>{path.detail}</span>
                      <div className={styles.bar}>
                        <div
                          className={styles.fill}
                          style={{
                            inlineSize: `${Math.round(path.progress * 100)}%`,
                          }}
                        />
                      </div>
                    </span>
                    <span />
                    <span>Today: {stage.today}</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
        {path.index === 4 && <p>{stages[4].today}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>This week</h2>
        <div className={styles.week}>
          <Figure label="lessons" value={week.week.lessons} />
          <Figure label="minutes" value={Math.round(week.week.minutes)} />
          <Figure
            label="accuracy"
            value={`${Math.floor(week.week.accuracy * 100)}%`}
            before={
              week.previous && `${Math.floor(week.previous.accuracy * 100)}%`
            }
          />
          <Figure
            label="wpm"
            value={Math.round(week.week.wpm)}
            before={week.previous && Math.round(week.previous.wpm)}
          />
        </div>
        <p>{week.verdict}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Fingers, last 20 lessons</h2>
        <div className={styles.fingers}>
          {fingers.map((stat) => (
            <FingerRow
              key={stat.finger}
              stat={stat}
              weak={stat === weakest}
              slowest={slowest}
            />
          ))}
        </div>
        <p className={styles.small}>
          Green shows accuracy, orange shows how slow each finger is.
        </p>
        <div className={styles.actions}>
          {weakest != null ? (
            <>
              <span>
                Needs the most work:{" "}
                <span className={styles.weak}>{weakest.finger}</span>
              </span>
              <Button
                icon={<Icon shape={mdiPlay} />}
                label="Drill it"
                onClick={() => setView("drills")}
              />
            </>
          ) : (
            <span className={styles.small}>
              A few more lessons and this shows which finger needs work.
            </span>
          )}
          <Button
            icon={<Icon shape={mdiPlay} />}
            label="Practice"
            onClick={() => setView("practice")}
          />
        </div>
      </section>
    </Screen>
  );
}

function Figure({
  label,
  value,
  before = null,
}: {
  readonly label: string;
  readonly value: ReactNode;
  readonly before?: ReactNode;
}): ReactNode {
  return (
    <div>
      <div className={styles.number}>{value}</div>
      <div className={styles.small}>
        {label}
        {before != null && ` (was ${before})`}
      </div>
    </div>
  );
}

function FingerRow({
  stat: { finger, letters, hits, misses, accuracy, time },
  weak,
  slowest,
}: {
  readonly stat: ReturnType<typeof fingerStats>[number];
  readonly weak: boolean;
  readonly slowest: number;
}): ReactNode {
  const empty = hits + misses === 0;
  return (
    <>
      <span className={clsx(weak && styles.weak)}>{finger}</span>
      <span className={styles.small}>{letters.toUpperCase() || "-"}</span>
      <div className={styles.bar} title={`${hits} hits, ${misses} misses`}>
        {!empty && (
          <div
            className={styles.fill}
            style={{ inlineSize: `${Math.round(accuracy * 100)}%` }}
          />
        )}
      </div>
      <span className={styles.small}>
        {empty ? "no data" : `${Math.floor(accuracy * 100)}%`}
      </span>
      <span />
      <span />
      <div className={styles.bar}>
        {!empty && (
          <div
            className={styles.slowFill}
            style={{ inlineSize: `${Math.round((time / slowest) * 100)}%` }}
          />
        )}
      </div>
      <span className={styles.small}>
        {empty ? "" : `${Math.round(time)} ms`}
      </span>
    </>
  );
}
