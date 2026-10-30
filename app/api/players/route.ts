import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["username", "country", "role", "date_of_birth"]);
  if (invalid) return invalid;

  try {
    const r = await pool.query(
      `INSERT INTO PLAYER (username, country, role, date_of_birth)
       VALUES ($1, $2, $3, $4) RETURNING player_id, username`,
      [body.username, body.country, body.role, body.date_of_birth]
    );
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
