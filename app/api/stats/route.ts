import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { authorize, body, failure, HttpError } from "@/lib/http";
import { schemas, parseId } from "@/lib/validation";
import { transaction } from "@/lib/transaction";
export async function POST(req: Request) {
  try {
    await authorize(req);
    const i = await body(req, schemas.stats);
    const result = await transaction(async (client) => {
      await client.query(
        "INSERT INTO PLAYED_BY(match_id,team_id,player_id) VALUES($1,$2,$3) ON CONFLICT(match_id,player_id) DO UPDATE SET team_id=excluded.team_id",
        [i.match_id, i.team_id, i.player_id],
      );
      const r = await client.query(
        `INSERT INTO PLAYER_MATCH_STATS(match_id,player_id,kills,deaths,assists,damage,rating) VALUES($1,$2,$3,$4,$5,$6,$7)
 ON CONFLICT(match_id,player_id) DO UPDATE SET kills=excluded.kills,deaths=excluded.deaths,assists=excluded.assists,damage=excluded.damage,rating=excluded.rating RETURNING *`,
        [
          i.match_id,
          i.player_id,
          i.kills,
          i.deaths,
          i.assists,
          i.damage,
          i.rating ?? null,
        ],
      );
      return r.rows[0];
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await authorize(req);
    const i = await body(
      req,
      schemas.stats.pick({ match_id: true, player_id: true }),
    );
    const r = await pool.query(
      "DELETE FROM PLAYED_BY WHERE match_id=$1 AND player_id=$2",
      [i.match_id, i.player_id],
    );
    if (!r.rowCount) throw new HttpError(404, "Participation not found");
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
