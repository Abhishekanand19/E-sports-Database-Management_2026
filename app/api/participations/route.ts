import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["tournament_id", "team_id"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO PARTICIPATES_IN (tournament_id, team_id, final_position)
       VALUES ($1, $2, $3) RETURNING *`,
      [body.tournament_id, body.team_id, body.final_position ?? null]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
