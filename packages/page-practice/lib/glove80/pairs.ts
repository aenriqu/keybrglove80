import { type Result } from "@keybr/result";

/** The most common English letter pairs, most frequent first. */
export const commonPairs: readonly string[] = (
  "th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se " +
  "ha as ou io le ve co me de hi ri ro ic ne ea ra ce li ch ll be ma si om ur"
).split(" ");

/** The first letters keybr teaches, used before there are any results. */
const starterLetters = "enitrlas";

/** How often each letter was missed lately, from 0 (never) to 1 (always). */
export function letterWeakness(
  results: readonly Result[],
): Map<string, number> {
  const hits = new Map<string, number>();
  const misses = new Map<string, number>();
  for (const { histogram } of results.slice(-20)) {
    for (const { codePoint, hitCount, missCount } of histogram) {
      const letter = String.fromCodePoint(codePoint).toLowerCase();
      hits.set(letter, (hits.get(letter) ?? 0) + hitCount);
      misses.set(letter, (misses.get(letter) ?? 0) + missCount);
    }
  }
  if (hits.size < starterLetters.length) {
    for (const letter of starterLetters) {
      hits.set(letter, hits.get(letter) ?? 1);
    }
  }
  const weakness = new Map<string, number>();
  for (const [letter, hit] of hits) {
    const miss = misses.get(letter) ?? 0;
    // Smoothed so a single miss on a rare letter does not dominate.
    weakness.set(letter, (miss + 1) / (hit + miss + 2));
  }
  return weakness;
}

/**
 * Picks the pairs to drill: only letters already practiced,
 * weakest first, skipping pairs already passed this session.
 */
export function pickPairs(
  weakness: ReadonlyMap<string, number>,
  passed: ReadonlySet<string>,
  count = 5,
): string[] {
  const known = commonPairs.filter(
    ([a, b]) => weakness.has(a) && weakness.has(b),
  );
  const fresh = known.filter((pair) => !passed.has(pair));
  const pool = fresh.length >= count ? fresh : known;
  const score = ([a, b]: string) =>
    (weakness.get(a) ?? 0) + (weakness.get(b) ?? 0);
  return [...pool]
    .map((pair, index) => ({ pair, score: score(pair) - index * 0.0001 }))
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map(({ pair }) => pair);
}

/** Each pair three times, then all pairs mixed, like "th th th he he he th he". */
export function drillText(pairs: readonly string[]): string {
  const groups = pairs.map((pair) => [pair, pair, pair].join(" "));
  return [...groups, pairs.join(" ")].join(" ");
}

/** A round passes at 96% accuracy, speed does not matter yet. */
export const passAccuracy = 0.96;
