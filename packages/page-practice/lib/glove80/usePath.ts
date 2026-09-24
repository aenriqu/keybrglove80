import { useResults } from "@keybr/result";
import { useEffect, useMemo, useState } from "react";
import { pathStage, type Stage } from "./path.ts";
import { reachStage, useQuestRecord } from "./store.ts";

/** The learner's path stage. `fresh` is true for a while after a stage up. */
export function usePath(): Stage & { readonly fresh: boolean } {
  const { results } = useResults();
  const { best, stage: reached, stageAt } = useQuestRecord();
  const stage = useMemo(
    () => pathStage(results, best, reached),
    [results, best, reached],
  );
  const [now] = useState(() => Date.now());
  useEffect(() => {
    reachStage(stage.index);
  }, [stage.index]);
  const fresh = stage.index > 0 && now - stageAt < 30 * 60 * 1000;
  return { ...stage, fresh };
}
