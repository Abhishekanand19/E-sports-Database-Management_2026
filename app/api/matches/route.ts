import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    await authorize(req, false);
    return NextResponse.json(
      (await pool.query("SELECT * FROM MATCH ORDER BY match_date,match_id"))
        .rows,
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    await authorize(req);
    const i = await body(req, schemas.matches);
    const r = await pool.query(
      "SELECT schedule_match($1,$2,$3,$4,$5) AS match_id",
      [i.tournament_id, i.match_date, i.round, i.team_a, i.team_b],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
