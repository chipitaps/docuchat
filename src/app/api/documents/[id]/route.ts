import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";
import { getSessionId, isUuid } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  try {
    const { id } = await ctx.params;
    if (!isUuid(id)) throw new HttpError(400, "Invalid document id.");

    const sessionId = await getSessionId();
    const rows = (await sql().query(
      `delete from documents where id = $1 and session_id = $2 returning id`,
      [id, sessionId],
    )) as { id: string }[];
    if (rows.length === 0) throw new HttpError(404, "Document not found.");

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
