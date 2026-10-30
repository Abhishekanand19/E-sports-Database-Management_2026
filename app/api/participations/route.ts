import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await authorize(req);
    const input = await body(req, schemas["participations"]);
    const r = await pool.query(
      "INSERT INTO PARTICIPATES_IN(tournament_id,team_id,final_position) VALUES($1,$2,$3) RETURNING *",
      [
        input.tournament_id ?? null,
        input.team_id ?? null,
        input.final_position ?? null,
      ],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await authorize(req);
    const input = await body(
      req,
      schemas["participations"].pick({ tournament_id: true, team_id: true }),
    );
    const r = await pool.query(
      "DELETE FROM PARTICIPATES_IN WHERE tournament_id=$1 AND team_id=$2",
      [input.tournament_id, input.team_id],
    );
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    await authorize(req);
    const input = await body(req, schemas["participations"]);
    const r = await pool.query(
      "UPDATE PARTICIPATES_IN SET tournament_id=$1,team_id=$2,final_position=$3 WHERE tournament_id=$1 AND team_id=$2 RETURNING *",
      [
        input.tournament_id ?? null,
        input.team_id ?? null,
        input.final_position ?? null,
      ],
    );
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return failure(e);
  }
}
