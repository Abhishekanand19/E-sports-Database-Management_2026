import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { dbErrorResponse } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Team memberships, played_by and stats rows are removed by ON DELETE CASCADE
    const r = await pool.query(`DELETE FROM PLAYER WHERE player_id = $1`, [id]);
    if (r.rowCount === 0) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    await invalidateAll();
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
