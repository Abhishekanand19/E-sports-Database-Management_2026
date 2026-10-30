import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    await authorize(req, false);
    const r = await pool.query("SELECT * FROM TEAM ORDER BY team_id");
    return NextResponse.json(r.rows);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    await authorize(req);
    const input = await body(req, schemas.teams);
    const r = await pool.query(
      "INSERT INTO TEAM(team_name,country,founded_date) VALUES($1,$2,$3) RETURNING *",
      [
        input.team_name ?? null,
        input.country ?? null,
        input.founded_date ?? null,
      ],
    );
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
