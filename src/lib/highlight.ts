import { embedDocuments } from "./ai";
import { cosine, pickHighlights, splitSentences, type Range } from "./sentences";
import type { Source } from "./retrieval";

const MAX_SENTENCES = 60;
const TIMEOUT_MS = 6000;

export type Highlights = Record<number, Range[]>;

export async function highlightSources(
  queryVector: number[],
  sources: Source[],
): Promise<Highlights> {
  try {
    const perSource = sources.map((source) => ({
      source,
      spans: splitSentences(source.content),
    }));

    const batch: { source: Source; span: Range }[] = [];
    for (const { source, spans } of perSource) {
      for (const span of spans) {
        if (batch.length < MAX_SENTENCES) batch.push({ source, span });
      }
    }
    if (batch.length === 0) return {};

    const vectors = await embedDocuments(
      batch.map(({ source, span }) => source.content.slice(span[0], span[1])),
      AbortSignal.timeout(TIMEOUT_MS),
    );

    const highlights: Highlights = {};
    for (const { source, spans } of perSource) {
      const rows = batch.flatMap((item, i) =>
        item.source === source ? [{ span: item.span, score: cosine(queryVector, vectors[i]) }] : [],
      );
      const picked = pickHighlights(
        rows.map((row) => row.span),
        rows.map((row) => row.score),
      );
      if (picked.length > 0 && spans.length > 0) highlights[source.id] = picked;
    }
    return highlights;
  } catch (error) {
    console.warn("Could not compute source highlights:", error);
    return {};
  }
}
