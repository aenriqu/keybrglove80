import { KeyboardProvider, type KeyId, useKeyboard } from "@keybr/keyboard";
import { KeyLayer, TargetLayer, VirtualKeyboard } from "@keybr/keyboard-ui";
import { Screen } from "@keybr/pages-shared";
import {
  Button,
  CheckBox,
  Icon,
  useView,
  useWindowEvent,
  Zoomer,
} from "@keybr/widget";
import { mdiArrowLeft, mdiPlay } from "@mdi/js";
import { clsx } from "clsx";
import { type ReactNode, useMemo, useState } from "react";
import { views } from "../views.tsx";
import { Buddy } from "./Buddy.tsx";
import { OsToggle } from "./OsToggle.tsx";
import {
  type Answer,
  groupKeys,
  groups,
  keyName,
  makeRound,
  summarize,
  type Summary,
} from "./quest.ts";
import * as styles from "./QuestScreen.module.less";
import { saveRound, useQuestRecord } from "./store.ts";

type Phase =
  | { readonly type: "menu" }
  | {
      readonly type: "play";
      readonly prompts: readonly KeyId[];
      readonly index: number;
      readonly answers: readonly Answer[];
      readonly missed: boolean;
      readonly wrong: KeyId | null;
      readonly shownAt: number;
    }
  | {
      readonly type: "done";
      readonly summary: Summary;
      readonly best: boolean;
    };

export function QuestScreen(): ReactNode {
  return (
    <KeyboardProvider>
      <QuestForKeyboard />
    </KeyboardProvider>
  );
}

/** Starts over from the menu whenever the keyboard changes. */
function QuestForKeyboard(): ReactNode {
  const { geometry } = useKeyboard();
  return <Quest key={geometry.id} />;
}

function Quest(): ReactNode {
  const { setView } = useView(views);
  const keyboard = useKeyboard();
  const record = useQuestRecord();
  const [groupId, setGroupId] = useState("thumbs");
  const [blind, setBlind] = useState(false);
  const [phase, setPhase] = useState<Phase>({ type: "menu" });
  const [pressed, setPressed] = useState<readonly KeyId[]>([]);
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const keys = useMemo(
    () => groupKeys(group, keyboard.geometry, (id) => keyboard.shapes.has(id)),
    [group, keyboard],
  );
  const mode = `${group.id}${blind ? ":blind" : ""}`;

  const start = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    setPhase({
      type: "play",
      prompts: makeRound(keys),
      index: 0,
      answers: [],
      missed: false,
      wrong: null,
      shownAt: performance.now(),
    });
  };

  useWindowEvent("keydown", (event) => {
    if (phase.type !== "play") {
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        start();
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) {
      return;
    }
    setPressed((list) =>
      list.includes(event.code) ? list : [...list, event.code],
    );
    const target = phase.prompts[phase.index];
    const time = performance.now() - phase.shownAt;
    if (event.code === target) {
      const answers = phase.missed
        ? phase.answers
        : [...phase.answers, { id: target, hit: true, time }];
      const index = phase.index + 1;
      if (index < phase.prompts.length) {
        setPhase({
          ...phase,
          index,
          answers,
          missed: false,
          wrong: null,
          shownAt: performance.now(),
        });
      } else {
        const summary = summarize(answers, blind);
        const best = saveRound(mode, summary.score, summary.xp);
        setPhase({ type: "done", summary, best });
      }
    } else if (!phase.missed) {
      setPhase({
        ...phase,
        answers: [...phase.answers, { id: target, hit: false, time }],
        missed: true,
        wrong: event.code,
      });
    } else {
      setPhase({ ...phase, wrong: event.code });
    }
  });

  useWindowEvent("keyup", (event) => {
    if (phase.type === "play") {
      event.preventDefault();
    }
    setPressed((list) => list.filter((code) => code !== event.code));
  });

  useWindowEvent("blur", () => {
    setPressed([]);
  });

  let target: KeyId | null = null;
  let body: ReactNode;
  switch (phase.type) {
    case "menu":
      body = (
        <div className={styles.menu}>
          <div className={styles.groups}>
            {groups.map((item) => (
              <button
                key={item.id}
                type="button"
                className={clsx(
                  styles.group,
                  item.id === group.id && styles.active,
                )}
                onClick={() => setGroupId(item.id)}
              >
                <span className={styles.groupName}>{item.name}</span>
                <span className={styles.groupBest}>
                  {record.best[item.id] ?? 0} /{" "}
                  {record.best[`${item.id}:blind`] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.row}>
            <CheckBox label="Blind" checked={blind} onChange={setBlind} />
            <Button
              icon={<Icon shape={mdiPlay} />}
              label="Start"
              disabled={keys.length === 0}
              onClick={start}
            />
          </div>
        </div>
      );
      break;
    case "play": {
      target = phase.prompts[phase.index];
      const hits = phase.answers.filter((a) => a.hit).length;
      body = (
        <div className={styles.play}>
          <div className={styles.progress}>
            {phase.index + 1} / {phase.prompts.length} · {hits} hit
          </div>
          <div className={clsx(styles.prompt, phase.missed && styles.miss)}>
            {keyName(target, keyboard.geometry)}
          </div>
          <div className={styles.hint}>
            {phase.wrong != null
              ? `that was ${keyName(phase.wrong, keyboard.geometry)}`
              : " "}
          </div>
        </div>
      );
      break;
    }
    case "done": {
      const { summary, best } = phase;
      body = (
        <div className={styles.done}>
          <div className={styles.score}>{summary.score}</div>
          {best && <div className={styles.best}>New best</div>}
          <div className={styles.stats}>
            <span>
              {summary.hits} / {summary.total} hit
            </span>
            <span>{Math.round(summary.avgTime)} ms avg</span>
            <span>+{summary.xp} XP</span>
          </div>
          <div className={styles.row}>
            <Button
              icon={<Icon shape={mdiPlay} />}
              label="Again"
              onClick={start}
            />
            <Button label="Menu" onClick={() => setPhase({ type: "menu" })} />
          </div>
        </div>
      );
      break;
    }
  }

  const reveal =
    target != null && (!blind || (phase.type === "play" && phase.missed))
      ? [target]
      : [];

  return (
    <Screen>
      <div className={styles.header}>
        <Button
          icon={<Icon shape={mdiArrowLeft} />}
          label="Practice"
          onClick={() => setView("practice")}
        />
        <h1 className={styles.title}>Key Quest</h1>
        <OsToggle />
      </div>
      <Buddy compact={true} />
      {body}
      <div className={styles.keyboard}>
        <Zoomer id="Keyboard/Quest">
          <VirtualKeyboard keyboard={keyboard} height="32rem">
            <KeyLayer depressedKeys={pressed} showColors={true} />
            <TargetLayer targets={reveal} />
          </VirtualKeyboard>
        </Zoomer>
      </div>
    </Screen>
  );
}
