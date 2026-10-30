import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await authorize(req);
    const input = await body(req, schemas["team-members"]);
    const r = await pool.query(
      "INSERT INTO TEAM_MEMBER(team_id,player_id,join_date,status,leave_date) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [
        input.team_id ?? null,
        input.player_id ?? null,
        input.join_date ?? null,
        input.status ?? null,
        input.leave_date ?? null,
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
      schemas["team-members"].pick({
        team_id: true,
        player_id: true,
        join_date: true,
      }),
    );
    const r = await pool.query(
      "DELETE FROM TEAM_MEMBER WHERE team_id=$1 AND player_id=$2 AND join_date=$3",
      [input.team_id, input.player_id, input.join_date],
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
    const input = await body(req, schemas["team-members"]);
    const r = await pool.query(
      "UPDATE TEAM_MEMBER SET team_id=$1,player_id=$2,join_date=$3,status=$4,leave_date=$5 WHERE team_id=$1 AND player_id=$2 AND join_date=$3 RETURNING *",
      [
        input.team_id ?? null,
        input.player_id ?? null,
        input.join_date ?? null,
        input.status ?? null,
        input.leave_date ?? null,
      ],
    );
    if (!r.rowCount) throw new HttpError(404, "Record not found");
    return NextResponse.json(r.rows[0]);
  } catch (e) {
    return failure(e);
  }
}
