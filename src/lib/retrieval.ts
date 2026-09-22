import { embedQuery } from "./ai";
import { LIMITS } from "./config";
import { sql, toVector } from "./db";

export type Source = {
  id: number;
  name: string;
  content: string;
  score: number;
};

type Row = { name: string; content: string; score: number | string };

export async function searchChunks(
  sessionId: string,
  query: string,
): Promise<{ sources: Source[]; queryVector: number[] }> {
  const queryVector = await embedQuery(query);
  const vector = toVector(queryVector);

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
