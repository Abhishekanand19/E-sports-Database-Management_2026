import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
async function idFrom(ctx: Context) {
  try {
    return parseId((await ctx.params).id);
  } catch {
    throw new HttpError(400, "Invalid id");
  }
}
export async function GET(req: Request, ctx: Context) {
  try {
    await authorize(req, false);
    const id = await idFrom(ctx);
    const r = await pool.query("SELECT * FROM PLAYER WHERE player_id=$1", [id]);
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request, ctx: Context) {
  try {
    await authorize(req);
    const id = await idFrom(ctx);
    const input = await body(req, schemas.players);
    const r = await pool.query(
      "UPDATE PLAYER SET username=$1,country=$2,role=$3,date_of_birth=$4 WHERE player_id=$5 RETURNING *",
      [
        input.username ?? null,
        input.country ?? null,
        input.role ?? null,
        input.date_of_birth ?? null,
        id,
      ],
    );
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    await authorize(req);
    const id = await idFrom(ctx);
    const r = await pool.query("DELETE FROM PLAYER WHERE player_id=$1", [id]);
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
