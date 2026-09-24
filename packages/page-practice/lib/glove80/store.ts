import { useSyncExternalStore } from "react";

export type QuestRecord = {
  /** Experience points earned in Key Quest. */
  readonly xp: number;
  /** Time stamps of finished rounds, for the streak counter. */
  readonly rounds: readonly number[];
  /** Best score per mode. */
  readonly best: { readonly [mode: string]: number };
};

const storageKey = "glove80.quest";

const empty: QuestRecord = { xp: 0, rounds: [], best: {} };

let cached: QuestRecord | null = null;
const listeners = new Set<() => void>();

function read(): QuestRecord {
  if (cached == null) {
    cached = empty;
    try {
      const json = localStorage.getItem(storageKey);
      if (json != null) {
        cached = { ...empty, ...(JSON.parse(json) as Partial<QuestRecord>) };
      }
    } catch {
      // Storage may be unavailable, keep the defaults.
    }
  }
  return cached;
}

function write(record: QuestRecord): void {
  cached = record;
  try {
    localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Storage may be unavailable, keep the value in memory only.
  }
  for (const listener of listeners) {
    listener();
  }
}

export function saveRound(mode: string, score: number, xp: number): boolean {
  const record = read();
  const best = record.best[mode] ?? 0;
  write({
    xp: record.xp + xp,
    rounds: [...record.rounds, Date.now()].slice(-400),
    best: { ...record.best, [mode]: Math.max(best, score) },
  });
  return score > best;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useQuestRecord(): QuestRecord {
  return useSyncExternalStore(subscribe, read, () => empty);
}
