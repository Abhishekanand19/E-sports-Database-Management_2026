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
    const r = await pool.query("SELECT * FROM TEAM WHERE team_id=$1", [id]);
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
    const input = await body(req, schemas.teams);
    const r = await pool.query(
      "UPDATE TEAM SET team_name=$1,country=$2,founded_date=$3 WHERE team_id=$4 RETURNING *",
      [
        input.team_name ?? null,
        input.country ?? null,
        input.founded_date ?? null,
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
    const r = await pool.query("DELETE FROM TEAM WHERE team_id=$1", [id]);
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
