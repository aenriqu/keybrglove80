import { Geometry, KeyboardOptions } from "@keybr/keyboard";
import { useSettings } from "@keybr/settings";
import { clsx } from "clsx";
import { memo, type ReactNode } from "react";
import * as styles from "./OsToggle.module.less";

const choices = [
  { geometry: Geometry.GLOVE80_WINDOWS, label: "Win" },
  { geometry: Geometry.GLOVE80_MAC, label: "Mac" },
] as const;

export const OsToggle = memo(function OsToggle({
  onChange,
}: {
  readonly onChange?: () => void;
}): ReactNode {
  const { settings, updateSettings } = useSettings();
  const options = KeyboardOptions.from(settings);
  const available = options.selectableGeometries();
  if (!choices.every(({ geometry }) => available.includes(geometry))) {
    return null;
  }
  return (
    <div className={styles.toggle} role="radiogroup" aria-label="Glove80 OS">
      {choices.map(({ geometry, label }) => (
        <button
          key={geometry.id}
          type="button"
          role="radio"
          aria-checked={options.geometry === geometry}
          className={clsx(
            styles.choice,
            options.geometry === geometry && styles.active,
          )}
          onClick={() => {
            if (options.geometry !== geometry) {
              updateSettings(options.withGeometry(geometry).save(settings));
              onChange?.();
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
});
