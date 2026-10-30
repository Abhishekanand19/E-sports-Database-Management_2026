import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./db";
export type User = {
  user_id: number;
  username: string;
  role: "admin" | "viewer";
};
export const COOKIE = "esports_session";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { rows } = await pool.query(
    `SELECT u.user_id,u.username,u.role FROM app_session s
    JOIN app_user u USING(user_id) WHERE token_hash=$1 AND expires_at>now()`,
    [tokenHash(token)],
  );
  return rows[0] ?? null;
}
export async function pageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  await pool.query("DELETE FROM app_session WHERE expires_at<=now()");
  await pool.query(
    `INSERT INTO app_session(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')`,
    [tokenHash(token), userId],
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.APP_ORIGIN?.startsWith("https://") !== false,
    sameSite: "lax",
    path: "/",
    maxAge: 28800,
  });
}
