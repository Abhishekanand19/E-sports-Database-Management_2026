import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["tournament_id", "match_date", "round"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO MATCH (tournament_id, match_date, round) VALUES ($1, $2, $3) RETURNING *`,
      [body.tournament_id, body.match_date, body.round]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
