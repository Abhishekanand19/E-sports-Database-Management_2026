import { pool } from "./db";
import { cachedQuery } from "./cache";
import { pageUser } from "./auth";

// Dates are cast to text in SQL so they reach the browser as plain "YYYY-MM-DD" strings.

export async function getDashboardCounts() {
  await pageUser();
  return cachedQuery("dashboard", 60, async () => {
    const r = await pool.query(`
      SELECT (SELECT COUNT(*)::int FROM PLAYER)     AS players,
             (SELECT COUNT(*)::int FROM TEAM)       AS teams,
             (SELECT COUNT(*)::int FROM TOURNAMENT) AS tournaments,
             (SELECT COUNT(*)::int FROM MATCH)      AS matches`);
    return r.rows[0] as {
      players: number;
      teams: number;
      tournaments: number;
      matches: number;
    };
  });
}

export async function listPlayers(q: string) {
  await pageUser();
  return cachedQuery(`players:${q.toLowerCase()}`, 60, async () => {
    const r = await pool.query(
      `SELECT player_id, username, country, role, date_of_birth::text AS date_of_birth
       FROM PLAYER
       WHERE username ILIKE $1 OR country ILIKE $1 OR role ILIKE $1
       ORDER BY username`,
      [`%${q}%`],
    );
    return r.rows;
  });
}

export async function listTeams() {
  await pageUser();
  return cachedQuery("teams", 60, async () => {
    const r = await pool.query(`
      SELECT t.team_id, t.team_name, t.country, t.founded_date::text AS founded_date,
             COUNT(tm.player_id) FILTER (WHERE tm.status = 'active')::int AS active_members,
             COALESCE(STRING_AGG(p.username, ', ' ORDER BY p.username)
                      FILTER (WHERE tm.status = 'active'), '') AS roster
      FROM TEAM t
      LEFT JOIN TEAM_MEMBER tm ON tm.team_id = t.team_id
      LEFT JOIN PLAYER p ON p.player_id = tm.player_id
      GROUP BY t.team_id
      ORDER BY t.team_name`);
    return r.rows;
  });
}

export async function listTournaments() {
  await pageUser();
  return cachedQuery("tournaments", 60, async () => {
    const r = await pool.query(`
      SELECT t.tournament_id, t.name, t.game_id, g.title AS game,
             t.start_date::text AS start_date, t.end_date::text AS end_date,
             t.prize_pool::float AS prize_pool,
             (SELECT COUNT(*)::int FROM PARTICIPATES_IN pi WHERE pi.tournament_id = t.tournament_id) AS teams
      FROM TOURNAMENT t JOIN GAME g ON g.game_id = t.game_id
      ORDER BY t.start_date DESC`);
    return r.rows;
  });
}

export async function getTournamentDetail(id: number) {
  await pageUser();
  return cachedQuery(`tournament:${id}`, 60, async () => {
    const [tour, teams, matches] = await Promise.all([
      pool.query(
        `SELECT t.name, g.title AS game, t.start_date::text AS start_date,
                t.end_date::text AS end_date, t.prize_pool::float AS prize_pool
         FROM TOURNAMENT t JOIN GAME g ON g.game_id = t.game_id
         WHERE t.tournament_id = $1`,
        [id],
      ),
      pool.query(
        `SELECT * FROM tournament_standings WHERE tournament_id=$1 ORDER BY points DESC, wins DESC, team_name`,
        [id],
      ),
      pool.query(
        `SELECT m.match_id, m.round, m.match_date::text AS match_date, r.score,
                w.team_name AS winner, l.team_name AS loser
         FROM MATCH m
         LEFT JOIN RESULT r ON r.match_id = m.match_id
         LEFT JOIN TEAM w ON w.team_id = r.winning_team_id
         LEFT JOIN TEAM l ON l.team_id = r.losing_team_id
         WHERE m.tournament_id = $1
         ORDER BY m.match_date, m.match_id`,
        [id],
      ),
    ]);
    return {
      tournament: tour.rows[0] ?? null,
      teams: teams.rows,
      matches: matches.rows,
    };
  });
}

export async function listMatches() {
  await pageUser();
  return cachedQuery("matches", 60, async () => {
    const r = await pool.query(`
      SELECT m.match_id, t.name AS tournament, m.round, m.match_date::text AS match_date,
             (SELECT string_agg(te.team_name, ' vs ' ORDER BY te.team_name) FROM MATCH_TEAM mt JOIN TEAM te USING(team_id) WHERE mt.match_id=m.match_id) AS opponents,
             w.team_name AS winner, l.team_name AS loser, r.score
      FROM MATCH m
      JOIN TOURNAMENT t ON t.tournament_id = m.tournament_id
      LEFT JOIN RESULT r ON r.match_id = m.match_id
      LEFT JOIN TEAM w ON w.team_id = r.winning_team_id
      LEFT JOIN TEAM l ON l.team_id = r.losing_team_id
      ORDER BY m.match_date DESC, m.match_id DESC`);
    return r.rows;
  });
}

export async function getPlayerStats(tournamentId: number | null = null) {
  await pageUser();
  return cachedQuery(
    `stats:${tournamentId}`,
    60,
    async () =>
      (await pool.query("SELECT * FROM player_performance($1)", [tournamentId]))
        .rows,
  );
}

export async function listRoster() {
  await pageUser();
  return (
    await pool.query(`SELECT tm.*,tm.join_date::text AS join_date,tm.leave_date::text AS leave_date,p.username,t.team_name
 FROM TEAM_MEMBER tm JOIN PLAYER p USING(player_id) JOIN TEAM t USING(team_id) ORDER BY t.team_name,p.username,tm.join_date`)
  ).rows;
}

/** Dropdown options for the forms; cached for longer because they change rarely. */
export async function getLookups() {
  await pageUser();
  return cachedQuery("lookups", 120, async () => {
    const [games, teams, players, tournaments, matches] = await Promise.all([
      pool.query(
        `SELECT game_id AS value, title AS label FROM GAME ORDER BY title`,
      ),
      pool.query(
        `SELECT team_id AS value, team_name AS label FROM TEAM ORDER BY team_name`,
      ),
      pool.query(
        `SELECT player_id AS value, username AS label FROM PLAYER ORDER BY username`,
      ),
      pool.query(
        `SELECT tournament_id AS value, name AS label FROM TOURNAMENT ORDER BY name`,
      ),
      pool.query(`SELECT match_id AS value, 'Match #' || match_id || ' (' || round || ')' AS label
                  FROM MATCH ORDER BY match_id`),
    ]);
    return {
      games: games.rows,
      teams: teams.rows,
      players: players.rows,
      tournaments: tournaments.rows,
      matches: matches.rows,
    };
  });
}
