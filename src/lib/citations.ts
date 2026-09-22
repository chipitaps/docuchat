import type { Source } from "./retrieval";

export type CitedSource = Source & {
  label: number;
};

const CITATION = /\[(\d+)\]/g;

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
