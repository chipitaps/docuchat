import { embedQuery } from "./ai";
import { LIMITS } from "./config";
import { sql, toVector } from "./db";

/** A retrieved chunk, as shown to the model and, under the answer, to the user. */
export type Source = {
  id: number;
  name: string;
  content: string;
  score: number;
};

type Row = { name: string; content: string; score: number | string };

/**
 * Top-k chunks for `query`, restricted to the caller's own documents.
 * Also returns the query embedding so callers can reuse it (source highlighting).
 */
export async function searchChunks(
  sessionId: string,
  query: string,
): Promise<{ sources: Source[]; queryVector: number[] }> {
  const queryVector = await embedQuery(query);
  const vector = toVector(queryVector);

  // Exact cosine search. Each session only holds a handful of chunks, so a
  // sequential scan over `chunks_session_idx` beats an ANN index here and,
  // unlike HNSW + a WHERE filter, never returns fewer than k rows.
  const rows = (await sql().query(
    `select d.name, c.content, 1 - (c.embedding <=> $1::vector) as score
       from chunks c
       join documents d on d.id = c.document_id
      where c.session_id = $2
      order by c.embedding <=> $1::vector
      limit $3`,
    [vector, sessionId, LIMITS.topK],
  )) as Row[];

  const sources = rows.map((row, i) => ({
    id: i + 1,
    name: row.name,
    content: row.content,
    score: Number(row.score),
  }));
  return { sources, queryVector };
}
