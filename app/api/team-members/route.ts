import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["team_id", "player_id", "join_date"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO TEAM_MEMBER (team_id, player_id, join_date, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [body.team_id, body.player_id, body.join_date, body.status ?? "active"]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
