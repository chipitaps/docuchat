export type Range = [start: number, end: number];

const BOUNDARY = /(?<=[.!?…])\s+|\n+/g;
const HEADING = /^#{1,6}\s/;

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
  let carry: number | null = null;
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
  minScore?: number;
  margin?: number;
  max?: number;
};

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
