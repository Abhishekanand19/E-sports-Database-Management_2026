import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { body, checkOrigin, failure, HttpError } from "@/lib/http";
import { schemas } from "@/lib/validation";
const dummyHash = hashPassword("unused-dummy-password-for-timing");
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const input = await body(req, schemas.login);
    const attempts = await pool.query(
      `INSERT INTO login_attempt(username) VALUES($1)
    ON CONFLICT(username) DO UPDATE SET
    attempts=CASE WHEN login_attempt.window_start<now()-interval '15 minutes' THEN 1 ELSE login_attempt.attempts+1 END,
    window_start=CASE WHEN login_attempt.window_start<now()-interval '15 minutes' THEN now() ELSE login_attempt.window_start END
    RETURNING attempts`,
      [input.username],
    );
    if (attempts.rows[0].attempts > 10)
      throw new HttpError(429, "Too many login attempts; retry in 15 minutes");
    const user = (
      await pool.query("SELECT * FROM app_user WHERE username=$1", [
        input.username,
      ])
    ).rows[0];
    const valid = await verifyPassword(
      input.password,
      user?.password_hash ?? (await dummyHash),
    );
    if (!user || !valid)
      throw new HttpError(401, "Invalid username or password");
    await pool.query("DELETE FROM login_attempt WHERE username=$1", [
      input.username,
    ]);
    await createSession(user.user_id);
    return NextResponse.json({ username: user.username, role: user.role });
  } catch (err) {
    return failure(err);
  }
}
