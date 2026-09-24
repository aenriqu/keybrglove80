import { useResults } from "@keybr/result";
import { clsx } from "clsx";
import {
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as styles from "./Buddy.module.less";
import { drawBuddy } from "./sprite.ts";
import { useQuestRecord } from "./store.ts";
import { buddyState, type Mood, stageOf, stages } from "./xp.ts";

export const Buddy = memo(function Buddy({
  compact = false,
}: {
  readonly compact?: boolean;
}): ReactNode {
  const { results } = useResults();
  const quest = useQuestRecord();
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
      </div>
    </div>
  );
});

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
