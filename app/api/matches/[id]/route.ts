import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await authorize(req);
    let id;
    try {
      id = parseId((await ctx.params).id);
    } catch {
      throw new HttpError(400, "Invalid id");
    }
    const r = await pool.query("DELETE FROM MATCH WHERE match_id=$1", [id]);
    if (!r.rowCount) throw new HttpError(404, "Match not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
