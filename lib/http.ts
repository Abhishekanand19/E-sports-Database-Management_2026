import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { dbErrorResponse } from "./api";
import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(req: Request) {
  const expected = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  if (req.headers.get("origin") && req.headers.get("origin") !== expected)
    throw new HttpError(403, "Cross-origin request rejected");
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Use application/json");
}
export async function authorize(req: Request, write = true) {
  if (write) checkOrigin(req);
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Sign in required");
  if (write && user.role !== "admin")
    throw new HttpError(403, "Admin access required");
  return user;
}
export async function body<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  const raw = await req.text();
  if (raw.length > 16384) throw new HttpError(413, "Request body is too large");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Request body must be JSON");
  }
  const result = schema.safeParse(parsed);
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  return result.data;
}
export function failure(err: unknown) {
  if (err instanceof HttpError)
    return NextResponse.json({ error: err.message }, { status: err.status });
  return dbErrorResponse(err);
}
