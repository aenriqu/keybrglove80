import { keyboardProps, useKeyboard } from "@keybr/keyboard";
import {
  flatten,
  HeatmapLayer,
  KeyLayer,
  PointersLayer,
  TransitionsLayer,
  VirtualKeyboard,
  ZonesLayer,
} from "@keybr/keyboard-ui";
import { type LessonKeys } from "@keybr/lesson";
import { useSettings } from "@keybr/settings";
import { type CodePoint } from "@keybr/unicode";
import { withDeferred } from "@keybr/widget";
import { memo, type ReactNode, useMemo } from "react";
import { type LastLesson } from "./state/index.ts";

export const KeyboardPresenter = memo(function KeyboardPresenter({
  focus,
  depressedKeys,
  toggledKeys,
  suffix,
  lastLesson,
  lessonKeys,
  missed = null,
  fade = false,
}: {
  readonly focus: boolean;
  readonly depressedKeys: readonly string[];
  readonly toggledKeys: readonly string[];
  readonly suffix: readonly CodePoint[];
  readonly lastLesson: LastLesson | null;
  readonly lessonKeys?: LessonKeys;
  readonly missed?: CodePoint | null;
  /** Hide the labels of mastered letters. */
  readonly fade?: boolean;
}): ReactNode {
  const { settings } = useSettings();
  const keyboard = useKeyboard();
  const colors = settings.get(keyboardProps.colors);
  const pointers = settings.get(keyboardProps.pointers);
  // Mastered letters lose their labels, so the fingers learn them
  // instead of the eyes. The next letter and a missed one stay visible.
  const next = suffix[0] ?? null;
  const hidden = useMemo(() => {
    const ids: string[] = [];
    if (!fade) {
      return ids;
    }
    for (const key of lessonKeys ?? []) {
      const { codePoint } = key.letter;
      const id = keyboard.getCombo(codePoint)?.id;
      if (
        id != null &&
        key.isIncluded &&
        (key.bestConfidence ?? 0) >= 1 &&
        codePoint !== missed &&
        codePoint !== next
      ) {
        ids.push(id);
      }
    }
    return ids;
  }, [keyboard, lessonKeys, missed, next, fade]);
  return (
    <>
      {hidden.length > 0 && (
        <style>
          {hidden
            .map((id) => `[data-key="${id}"] text { opacity: 0; }`)
            .join("\n")}
        </style>
      )}
      <VirtualKeyboard
        keyboard={keyboard}
        height={keyboard.geometry.isGlove80 ? "32rem" : "16rem"}
      >
        <KeyLayer
          depressedKeys={depressedKeys}
          toggledKeys={toggledKeys}
          showColors={colors}
        />
        {focus && pointers && <PointersLayer suffix={suffix} />}
        {focus && lastLesson && (
          <HeatmapLayer histogram={flatten(lastLesson.misses)} modifier="m" />
        )}
        {focus && lastLesson && (
          <HeatmapLayer histogram={flatten(lastLesson.hits)} modifier="h" />
        )}
        {focus && lastLesson && (
          <TransitionsLayer histogram={lastLesson.misses2} modifier="m" />
        )}
        {focus && lastLesson && (
          <TransitionsLayer histogram={lastLesson.hits2} modifier="h" />
        )}
        {focus || <ZonesLayer />}
      </VirtualKeyboard>
    </>
  );
});

export const DeferredKeyboardPresenter = withDeferred(KeyboardPresenter);
