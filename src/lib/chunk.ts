const BREAKS = ["\n\n", "\n", ". ", " "];

/** Position just after the best natural break in `window` at or past `min`. */
function findBreak(window: string, min: number): number {
  for (const sep of BREAKS) {
    const i = window.lastIndexOf(sep);
    if (i >= min) return i + sep.length;
  }
  return window.length;
}

/**
 * Splits text into overlapping chunks, preferring paragraph, then line,
 * then sentence, then word boundaries so chunks stay readable.
 */
export function chunkText(text: string, size = 1000, overlap = 150): string[] {
  if (overlap >= size) throw new Error("overlap must be smaller than size");

  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    const window = clean.slice(start, start + size);
    const isLast = start + size >= clean.length;
    const cut = isLast ? window.length : findBreak(window, Math.floor(size * 0.6));

    const chunk = window.slice(0, cut).trim();
    if (chunk) chunks.push(chunk);

    if (isLast) break;
    start += Math.max(cut - overlap, 1);
  }

  return chunks;
}
