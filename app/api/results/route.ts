import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

// Records (or corrects) the result of a match. One result per match.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["match_id", "winning_team_id", "losing_team_id", "score"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO RESULT (match_id, winning_team_id, losing_team_id, score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (match_id) DO UPDATE SET
         winning_team_id = EXCLUDED.winning_team_id,
         losing_team_id  = EXCLUDED.losing_team_id,
         score           = EXCLUDED.score,
         recorded_at     = NOW()
       RETURNING *`,
      [body.match_id, body.winning_team_id, body.losing_team_id, body.score]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
