import { lessonProps } from "@keybr/lesson";
import { useResults } from "@keybr/result";
import { useSettings } from "@keybr/settings";
import { useView } from "@keybr/widget";
import { clsx } from "clsx";
import {
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { views } from "../views.tsx";
import * as styles from "./Buddy.module.less";
import * as coachStyles from "./Coach.module.less";
import { coachTip, lessonStars } from "./coach.ts";
import { sessionMinutes, stages as pathStages } from "./path.ts";
import { drawBuddy } from "./sprite.ts";
import { useQuestRecord } from "./store.ts";
import { usePath } from "./usePath.ts";
import { buddyState, type Mood, stageOf, stages } from "./xp.ts";

export const Buddy = memo(function Buddy({
  compact = false,
  coach = false,
}: {
  readonly compact?: boolean;
  readonly coach?: boolean;
}): ReactNode {
  const { results } = useResults();
  const { settings } = useSettings();
  const last = results.at(-1);
  const quest = useQuestRecord();
  const path = usePath();
  const { setView } = useView(views);
  const [now] = useState(() => Date.now());
  const state = useMemo(
    () =>
      buddyState(
        results,
        quest.xp,
        quest.rounds,
        Math.max(now, results.at(-1)?.timeStamp ?? 0, quest.rounds.at(-1) ?? 0),
      ),
    [results, quest, now],
  );
  const gain = useGain(state.xp);
  const stage = stageOf(state.level);
  const next = stages[stage + 1];
  return (
    <div className={clsx(styles.buddy, compact && styles.compact)}>
      <div className={styles.spriteBox}>
        <Sprite stage={stage} mood={state.mood} size={compact ? 48 : 72} />
        {gain > 0 && (
          <span key={state.xp} className={styles.gain}>
            +{gain}
          </span>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          <span className={styles.level}>Lv {state.level}</span>
          <span className={styles.stage}>{stages[stage].name}</span>
        </div>
        <div
          className={styles.bar}
          title={`${state.levelXp} / ${state.levelSize} XP`}
        >
          <div
            className={styles.fill}
            style={{
              inlineSize: `${Math.round((state.levelXp / state.levelSize) * 100)}%`,
            }}
          />
        </div>
        <div className={styles.meta}>
          <span>
            {state.levelXp} / {state.levelSize} XP
          </span>
          <span className={clsx(state.today && styles.lit)}>
            {state.streak}d streak
          </span>
          {!compact && next != null && (
            <span>
              {next.name} at Lv {next.level}
            </span>
          )}
        </div>
        {coach && (
          <button
            type="button"
            className={styles.path}
            title="Open your path"
            onClick={() => setView("path")}
          >
            Stage {path.index + 1}/{pathStages.length} ·{" "}
            {pathStages[path.index].name} · {path.detail}
          </button>
        )}
        {coach && last != null && (
          <div className={styles.tip}>
            Last lesson{" "}
            <span className={coachStyles.stars}>
              {stars(lessonStars(last, settings.get(lessonProps.targetSpeed)))}
            </span>
          </div>
        )}
        {coach && (
          <div className={styles.tip}>
            {coachTip(last, results.length, {
              stageUp: path.fresh ? pathStages[path.index] : null,
              sessionMinutes: sessionMinutes(
                results,
                Math.max(now, last?.timeStamp ?? 0),
              ),
            })}
          </div>
        )}
      </div>
    </div>
  );
});

function stars(count: number): string {
  return "\u2605".repeat(count) + "\u2606".repeat(5 - count);
}

export function Sprite({
  stage,
  mood,
  size,
}: {
  readonly stage: number;
  readonly mood: Mood;
  readonly size: number;
}): ReactNode {
  const pixels = useMemo(() => drawBuddy(stage, mood), [stage, mood]);
  return (
    <svg
      className={clsx(styles.sprite, styles[mood])}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
    >
      {pixels.map(({ x, y, c }, index) => (
        <rect key={index} x={x} y={y} width={1} height={1} fill={c} />
      ))}
    </svg>
  );
}

/** Returns the XP gained since the previous render, shown for a moment. */
function useGain(xp: number): number {
  const last = useRef(xp);
  const [gain, setGain] = useState(0);
  useEffect(() => {
    const delta = xp - last.current;
    last.current = xp;
    if (delta > 0) {
      setGain(delta);
      const timer = setTimeout(() => setGain(0), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [xp]);
  return gain;
}
