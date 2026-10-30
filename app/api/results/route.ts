import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await authorize(req);
    const i = await body(req, schemas.results);
    const r = await pool.query(
      `INSERT INTO RESULT(match_id,winning_team_id,losing_team_id,score) VALUES($1,$2,$3,$4)
 ON CONFLICT(match_id) DO UPDATE SET winning_team_id=excluded.winning_team_id,losing_team_id=excluded.losing_team_id,score=excluded.score,recorded_at=now() RETURNING *`,
      [i.match_id, i.winning_team_id, i.losing_team_id, i.score],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await authorize(req);
    const i = await body(req, schemas.results.pick({ match_id: true }));
    const r = await pool.query("DELETE FROM RESULT WHERE match_id=$1", [
      i.match_id,
    ]);
    if (!r.rowCount) throw new HttpError(404, "Result not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
