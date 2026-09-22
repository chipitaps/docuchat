import type { Source } from "./retrieval";

export type CitedSource = Source & {
  /** Number shown to the user: 1, 2, 3… in order of first appearance. */
  label: number;
};

const CITATION = /\[(\d+)\]/g;

/**
 * Turns the model's `[3]` markers into numbered Markdown links (`[1](#cite-1)`)
 * and lists the sources it actually cited. Numbers are reassigned in reading
 * order, so an answer citing excerpts 2 and 3 shows 1 and 2. Markers that
 * don't match a retrieved excerpt are left untouched.
 */
export function prepareCitations(
  text: string,
  sources: Source[],
): { text: string; cited: CitedSource[] } {
  const byId = new Map(sources.map((source) => [source.id, source]));
  const labels = new Map<number, number>();

  const linked = text.replace(CITATION, (marker, raw: string) => {
    const id = Number(raw);
    if (!byId.has(id)) return marker;
    if (!labels.has(id)) labels.set(id, labels.size + 1);
    const label = labels.get(id);
    return `[${label}](#cite-${label})`;
  });

  const cited = [...labels].map(([id, label]) => ({ ...byId.get(id)!, label }));
  return { text: linked, cited };
}
