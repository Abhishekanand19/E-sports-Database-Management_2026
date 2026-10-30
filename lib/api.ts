import { NextResponse } from "next/server";

/** Returns a 400 response if any required field is missing, otherwise null. */
export function validate(
  body: Record<string, unknown> | null,
  fields: string[],
) {
  if (!body) {
    return NextResponse.json(
      { error: "Request body must be JSON" },
      { status: 400 },
    );
  }
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === "",
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  return null;
}

/** Maps PostgreSQL constraint errors to readable HTTP responses. */
export function dbErrorResponse(err: unknown) {
  const code = (err as { code?: string }).code;
  const messages: Record<string, [number, string]> = {
    "23505": [409, "This record already exists (duplicate value)"],
    "23503": [400, "A linked record does not exist (foreign key violation)"],
    "23514": [400, "A value breaks a data rule (check constraint)"],
    "22P02": [400, "Invalid input format"],
    "22007": [400, "Invalid date format"],
    "22008": [400, "Invalid calendar date"],
    "22003": [400, "Number is outside the supported range"],
    "23502": [400, "A required value is missing"],
    "40001": [409, "Concurrent change; please retry"],
    "40P01": [409, "Concurrent change; please retry"],
  };
  const [status, error] = messages[code ?? ""] ?? [500, "Database error"];
  if (status === 500) console.error(err);
  return NextResponse.json({ error }, { status });
}
