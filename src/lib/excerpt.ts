import type { Range } from "./sentences";

export type Segment = { text: string; marked: boolean };

export type Excerpt = {
  segments: Segment[];
  leading: boolean;
  trailing: boolean;
};

const isSpace = (char: string) => /\s/.test(char);
const HEADING_LINE = /^\s*#{1,6}\s/;

export const stripHeadings = (text: string) => text.replace(/^[ \t]*#{1,6}\s.*$/gm, "");

const hasProse = (text: string) =>
  text.split("\n").some((line) => line.trim() !== "" && !HEADING_LINE.test(line));

function trimHeadings(content: string, start: number, end: number) {
  for (;;) {
    const newline = content.indexOf("\n", start);
    const stop = newline === -1 || newline > end ? end : newline;
    const line = content.slice(start, stop);
    if (line.trim() !== "" && !HEADING_LINE.test(line)) break;
    if (stop >= end) break;
    start = stop + 1;
  }
  for (;;) {
    const lineStart = content.lastIndexOf("\n", end - 1) + 1;
    if (lineStart <= start) break;
    const line = content.slice(lineStart, end);
    if (line.trim() !== "" && !HEADING_LINE.test(line)) break;
    end = lineStart - 1;
  }
  return { start, end };
}

function snapForward(text: string, pos: number, limit: number) {
  while (pos > 0 && pos < limit && !isSpace(text[pos - 1])) pos++;
  return pos;
}
function snapBackward(text: string, pos: number, limit: number) {
  while (pos < text.length && pos > limit && !isSpace(text[pos])) pos--;
  return pos;
}

export function buildExcerpt(
  content: string,
  ranges: Range[],
  { full = false, radius = 140 }: { full?: boolean; radius?: number } = {},
): Excerpt {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  let start = 0;
  let end = content.length;

  if (!full) {
    const first = sorted[0]?.[0] ?? 0;
    const last = sorted.length ? sorted[sorted.length - 1][1] : Math.min(content.length, radius * 2);
    start = snapForward(content, Math.max(0, first - radius), first);
    end = snapBackward(content, Math.min(content.length, last + radius), last);
    if (start < 40) start = 0;
    if (content.length - end < 40) end = content.length;

    const trimmed = trimHeadings(content, start, end);
    start = sorted.length ? Math.min(trimmed.start, first) : trimmed.start;
    end = sorted.length ? Math.max(trimmed.end, last) : trimmed.end;
  }

  const segments: Segment[] = [];
  let cursor = start;
  for (const [s, e] of sorted) {
    const from = Math.max(s, start);
    const to = Math.min(e, end);
    if (to <= from) continue;
    if (from > cursor) segments.push({ text: content.slice(cursor, from), marked: false });
    segments.push({ text: content.slice(from, to), marked: true });
    cursor = to;
  }
  if (cursor < end) segments.push({ text: content.slice(cursor, end), marked: false });

  return {
    segments,
    leading: hasProse(content.slice(0, start)),
    trailing: hasProse(content.slice(end)),
  };
}
