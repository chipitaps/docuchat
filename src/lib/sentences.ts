/** Half-open character range [start, end) into a string. */
export type Range = [start: number, end: number];

// A sentence ends after . ! ? … followed by whitespace, or at a line break.
const BOUNDARY = /(?<=[.!?…])\s+|\n+/g;
const HEADING = /^#{1,6}\s/;

/**
 * Sentence spans of `text` as character ranges. Fragments shorter than
 * `minLength` (abbreviations, list stubs) are joined to the sentence that
 * follows; Markdown headings are dropped since they never answer anything.
 */
export function splitSentences(text: string, minLength = 24): Range[] {
  const fragments: Range[] = [];
  const addFragment = (from: number, to: number) => {
    while (from < to && /\s/.test(text[from])) from++;
    while (to > from && /\s/.test(text[to - 1])) to--;
    if (to > from) fragments.push([from, to]);
  };

  let start = 0;
  for (const match of text.matchAll(BOUNDARY)) {
    addFragment(start, match.index);
    start = match.index + match[0].length;
  }
  addFragment(start, text.length);

  const spans: Range[] = [];
  let carry: number | null = null; // start of a short fragment waiting for the next one
  let lastEnd = 0;
  for (const [s, e] of fragments) {
    if (HEADING.test(text.slice(s, e))) continue;
    lastEnd = e;
    const from: number = carry ?? s;
    if (e - from < minLength) {
      carry = from;
      continue;
    }
    spans.push([from, e]);
    carry = null;
  }
  if (carry !== null) {
    if (spans.length > 0) spans[spans.length - 1][1] = lastEnd;
    else spans.push([carry, lastEnd]);
  }
  return spans;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / Math.sqrt(normA * normB) || 0;
}

type PickOptions = {
  /**
   * Below this best score nothing is highlighted: no sentence is a clear match.
   * Calibrated on gemini-embedding-001 (768 dims): unrelated questions peak
   * around 0.55, relevant ones land between 0.63 and 0.81.
   */
  minScore?: number;
  /** A runner-up is also highlighted when within this distance of the best. */
  margin?: number;
  max?: number;
};

/** The sentence(s) that best match the query, in document order. */
export function pickHighlights(
  spans: Range[],
  scores: number[],
  { minScore = 0.58, margin = 0.04, max = 2 }: PickOptions = {},
): Range[] {
  if (spans.length === 0) return [];
  const ranked = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const best = scores[ranked[0]];
  if (best < minScore) return [];
  return ranked
    .slice(0, max)
    .filter((i) => scores[i] >= best - margin)
    .sort((a, b) => a - b)
    .map((i) => spans[i]);
}
