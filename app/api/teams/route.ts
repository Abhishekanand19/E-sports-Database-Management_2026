import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["team_name", "country"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO TEAM (team_name, country, founded_date) VALUES ($1, $2, $3)
       RETURNING team_id, team_name`,
      [body.team_name, body.country, body.founded_date ?? null]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
