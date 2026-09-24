import { useResults } from "@keybr/result";
import { type ReactNode, useEffect, useRef } from "react";
import * as styles from "./Coach.module.less";
import { paceSpeed } from "./coach.ts";
import { usePath } from "./usePath.ts";

type Lesson = {
  readonly textInput: { readonly pos: number; readonly length: number };
};

/**
 * A thin bar under the text: your progress, and a marker moving at
 * a pace a bit faster than your recent average. Keep up with the marker.
 */
export function PaceBar({ lesson }: { readonly lesson: Lesson }): ReactNode {
  const { results } = useResults();
  // The pace line turns on at stage 3, once accuracy holds.
  const pace = usePath().index >= 2 ? paceSpeed(results) : 0;
  const youRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pace === 0) {
      return undefined;
    }
    let startedAt: number | null = null;
    let frame = 0;
    const tick = () => {
      const { pos, length } = lesson.textInput;
      const now = performance.now();
      startedAt = pos === 0 ? null : (startedAt ?? now);
      const paced = startedAt == null ? 0 : ((now - startedAt) / 60000) * pace;
      const you = youRef.current;
      const marker = markerRef.current;
      if (you != null && marker != null && length > 0) {
        you.style.inlineSize = `${(pos / length) * 100}%`;
        you.toggleAttribute("data-behind", pos + 0.5 < paced);
        marker.style.insetInlineStart = `${Math.min(1, paced / length) * 100}%`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [lesson, pace]);
  if (pace === 0) {
    return null;
  }
  return (
    <div className={styles.pace}>
      <div ref={youRef} className={styles.you} />
      <div ref={markerRef} className={styles.marker} />
      <span className={styles.paceLabel}>pace {Math.round(pace / 5)} wpm</span>
    </div>
  );
}
