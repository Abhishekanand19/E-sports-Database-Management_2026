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
    const r = await pool.query(
      "SELECT * FROM TOURNAMENT WHERE tournament_id=$1",
      [id],
    );
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
    const input = await body(req, schemas.tournaments);
    const r = await pool.query(
      "UPDATE TOURNAMENT SET name=$1,game_id=$2,start_date=$3,end_date=$4,prize_pool=$5 WHERE tournament_id=$6 RETURNING *",
      [
        input.name ?? null,
        input.game_id ?? null,
        input.start_date ?? null,
        input.end_date ?? null,
        input.prize_pool ?? null,
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
    const r = await pool.query(
      "DELETE FROM TOURNAMENT WHERE tournament_id=$1",
      [id],
    );
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
