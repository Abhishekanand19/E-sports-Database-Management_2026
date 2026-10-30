import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE, tokenHash } from "@/lib/auth";
import { pool } from "@/lib/db";
import { checkOrigin, failure } from "@/lib/http";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token)
      await pool.query("DELETE FROM app_session WHERE token_hash=$1", [
        tokenHash(token),
      ]);
    jar.delete(COOKIE);
    return NextResponse.json({ signedOut: true });
  } catch (err) {
    return failure(err);
  }
}
