import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { invalidateAll } from "@/lib/cache";
import { validate, dbErrorResponse } from "@/lib/api";

// Saves a player's line for one match. Two tables change together, so we use a transaction:
// either both the PLAYED_BY link and the stats row are saved, or neither is.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const invalid = validate(body, ["match_id", "team_id", "player_id", "kills", "deaths", "assists", "damage"]);
  if (invalid) return invalid;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO PLAYED_BY (match_id, team_id, player_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [body.match_id, body.team_id, body.player_id]
    );
    const r = await client.query(
      `INSERT INTO PLAYER_MATCH_STATS (match_id, player_id, kills, deaths, assists, damage, rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (match_id, player_id) DO UPDATE SET
         kills = EXCLUDED.kills, deaths = EXCLUDED.deaths, assists = EXCLUDED.assists,
         damage = EXCLUDED.damage, rating = EXCLUDED.rating
       RETURNING *`,
      [body.match_id, body.player_id, body.kills, body.deaths, body.assists, body.damage, body.rating ?? null]
    );
    await client.query("COMMIT");
    await invalidateAll();
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    return dbErrorResponse(err);
  } finally {
    client.release();
  }
}
