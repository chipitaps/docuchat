import { embedDocuments } from "@/lib/ai";
import { chunkText } from "@/lib/chunk";
import { ACCEPTED_EXTENSIONS, CHUNK, LIMITS } from "@/lib/config";
import { sql, toVector } from "@/lib/db";
import { extractText } from "@/lib/extract";
import { errorResponse, HttpError } from "@/lib/http";
import { getSessionId } from "@/lib/session";
import type { DocumentSummary } from "@/lib/types";

export const maxDuration = 60;

type Row = { id: string; name: string; chunk_count: number; created_at: string };

const toSummary = (row: Row): DocumentSummary => ({
  id: row.id,
  name: row.name,
  chunkCount: row.chunk_count,
  createdAt: row.created_at,
});

export async function GET() {
  try {
    const sessionId = await getSessionId();
    const rows = (await sql().query(
      `select id, name, chunk_count, created_at
         from documents where session_id = $1 order by created_at desc`,
      [sessionId],
    )) as Row[];
    return Response.json({ documents: rows.map(toSummary) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const sessionId = await getSessionId();

    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) {
      throw new HttpError(400, "Attach a file in the 'file' field.");
    }
    if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      throw new HttpError(415, `Only ${ACCEPTED_EXTENSIONS.join(", ")} files are supported.`);
    }
    if (file.size > LIMITS.maxFileBytes) {
      throw new HttpError(413, `File is larger than ${LIMITS.maxFileBytes / 1024 / 1024} MB.`);
    }

    const db = sql();

    await db.query(
      `delete from documents where created_at < now() - make_interval(hours => $1)`,
      [LIMITS.retentionHours],
    );

    const [{ count }] = (await db.query(
      `select count(*)::int as count from documents where session_id = $1`,
      [sessionId],
    )) as { count: number }[];
    if (count >= LIMITS.maxDocsPerSession) {
      throw new HttpError(409, `You can keep up to ${LIMITS.maxDocsPerSession} documents. Delete one first.`);
    }

    const chunks = chunkText(await extractText(file), CHUNK.size, CHUNK.overlap);
    if (chunks.length === 0) {
      throw new HttpError(422, "No text found. Scanned PDFs need OCR first.");
    }
    if (chunks.length > LIMITS.maxChunksPerDoc) {
      throw new HttpError(413, `Document is too long for the demo (max ${LIMITS.maxChunksPerDoc} chunks).`);
    }

    const embeddings = await embedDocuments(chunks);

    const [row] = (await db.query(
      `with d as (
         insert into documents (session_id, name, chunk_count)
         values ($1, $2, $3) returning id, name, chunk_count, created_at
       ), c as (
         insert into chunks (document_id, session_id, chunk_index, content, embedding)
         select d.id, $1, t.i, t.content, t.embedding::vector
           from d, unnest($4::int[], $5::text[], $6::text[]) as t(i, content, embedding)
       )
       select * from d`,
      [
        sessionId,
        file.name,
        chunks.length,
        chunks.map((_, i) => i),
        chunks,
        embeddings.map(toVector),
      ],
    )) as Row[];

    return Response.json({ document: toSummary(row) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
