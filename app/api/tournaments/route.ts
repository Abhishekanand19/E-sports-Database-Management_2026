import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["name", "game_id", "start_date", "end_date", "prize_pool"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO TOURNAMENT (name, game_id, start_date, end_date, prize_pool)
       VALUES ($1, $2, $3, $4, $5) RETURNING tournament_id, name`,
      [body.name, body.game_id, body.start_date, body.end_date, body.prize_pool]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
