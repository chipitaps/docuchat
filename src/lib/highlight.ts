import { embedDocuments } from "./ai";
import { cosine, pickHighlights, splitSentences, type Range } from "./sentences";
import type { Source } from "./retrieval";

/** Keeps the extra embedding call small: ~5 chunks x ~10 sentences. */
const MAX_SENTENCES = 60;
const TIMEOUT_MS = 6000;

/** Highlighted character ranges per source id. */
export type Highlights = Record<number, Range[]>;

/**
 * Finds, inside each retrieved chunk, the sentence(s) closest to the question,
 * so the UI can show *where* an answer came from. Uses the same embedding
 * space as retrieval, which also works when question and document are in
 * different languages.
 *
 * Highlights are a nicety: this never throws and returns what it has, so a
 * quota error or timeout can't break the answer.
 */
export async function highlightSources(
  queryVector: number[],
  sources: Source[],
): Promise<Highlights> {
  try {
    const perSource = sources.map((source) => ({
      source,
      spans: splitSentences(source.content),
    }));

    // Sources arrive best-first, so if the cap bites the weakest ones lose out.
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
