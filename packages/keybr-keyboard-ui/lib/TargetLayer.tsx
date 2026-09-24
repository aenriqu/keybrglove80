import { type KeyId, useKeyboard } from "@keybr/keyboard";
import { memo, type ReactNode } from "react";
import { keyGap, keySize, Surface } from "./shapes.tsx";
import * as styles from "./TargetLayer.module.less";

/** Draws a pulsing outline around the given keys. */
export const TargetLayer = memo(function TargetLayer({
  targets,
}: {
  readonly targets: readonly KeyId[];
}): ReactNode {
  const keyboard = useKeyboard();
  const children: ReactNode[] = [];
  for (const id of targets) {
    const shape = keyboard.getShape(id);
    if (shape != null) {
      children.push(
        <rect
          key={id}
          className={styles.target}
          x={shape.x * keySize - 3}
          y={shape.y * keySize - 3}
          width={shape.w * keySize - keyGap + 6}
          height={shape.h * keySize - keyGap + 6}
          rx={6}
          ry={6}
        />,
      );
    }
  }
  return <Surface>{children}</Surface>;
});
