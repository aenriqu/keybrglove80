import { useKeyboard } from "@keybr/keyboard";
import { type CodePoint } from "@keybr/unicode";
import { clsx } from "clsx";
import { memo, type ReactNode } from "react";
import * as styles from "./Coach.module.less";
import { fingerHint } from "./finger.ts";

/** One line naming the finger for the next key, red after a miss. */
export const FingerHint = memo(function FingerHint({
  codePoint,
  missed,
}: {
  readonly codePoint: CodePoint | null;
  readonly missed: boolean;
}): ReactNode {
  const keyboard = useKeyboard();
  const hint = codePoint != null ? fingerHint(keyboard, codePoint) : null;
  return (
    <div className={clsx(styles.hint, missed && styles.missed)}>
      {hint != null && (
        <>
          {missed && "Missed: "}
          <kbd className={styles.key}>{hint.char}</kbd>{" "}
          <span className={styles.finger}>{hint.finger}</span> · {hint.move}
        </>
      )}
    </div>
  );
});
