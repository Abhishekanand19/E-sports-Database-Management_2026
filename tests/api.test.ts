import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { hashPassword } from "../lib/password";
const base = process.env.BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const tag = `api_${Date.now()}`;
const password = randomBytes(24).toString("hex");
let admin = "",
  viewer = "",
  player = 0,
  teamA = 0,
  teamB = 0,
  tournament = 0,
  match = 0;
async function call(
  path: string,
  method = "GET",
  data: unknown = undefined,
  cookie = admin,
) {
  return fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
async function json(path: string, method: string, data: unknown, status = 201) {
  const res = await call(path, method, data);
  const result = await res.json();
  assert.equal(res.status, status, JSON.stringify(result));
  return result;
}
before(async () => {
  for (const role of ["admin", "viewer"])
    await pool.query(
      "INSERT INTO app_user(username,password_hash,role) VALUES($1,$2,$3)",
      [`${tag}_${role}`, await hashPassword(password), role],
    );
  for (const role of ["admin", "viewer"]) {
    const res = await call(
      "/api/auth/login",
      "POST",
      { username: `${tag}_${role}`, password },
      "",
    );
    assert.equal(res.status, 200);
    const cookie = res.headers.get("set-cookie")!.split(";")[0];
    if (role === "admin") admin = cookie;
    else viewer = cookie;
  }
});
after(async () => {
  if (match) await pool.query("DELETE FROM MATCH WHERE match_id=$1", [match]);
  if (tournament) {
    await pool.query("DELETE FROM PARTICIPATES_IN WHERE tournament_id=$1", [
      tournament,
    ]);
    await pool.query("DELETE FROM TOURNAMENT WHERE tournament_id=$1", [
      tournament,
    ]);
  }
  await pool.query("DELETE FROM TEAM WHERE team_name LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM PLAYER WHERE username LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM app_user WHERE username LIKE $1", [tag + "%"]);
  await pool.query("DELETE FROM login_attempt WHERE username LIKE $1", [
    tag + "%",
  ]);
  await pool.end();
});
const mutations: [string, string][] = [
  ...[
    "players",
    "teams",
    "tournaments",
    "matches",
    "results",
    "stats",
    "participations",
    "team-members",
  ].map((x) => [`/api/${x}`, "POST"] as [string, string]),
  ...["players", "teams", "tournaments"].map(
    (x) => [`/api/${x}/1`, "PUT"] as [string, string],
  ),
  ...["players", "teams", "tournaments", "matches"].map(
    (x) => [`/api/${x}/999999`, "DELETE"] as [string, string],
  ),
  ...["results", "stats", "participations", "team-members"].map(
    (x) => [`/api/${x}`, "DELETE"] as [string, string],
  ),
  ["/api/participations", "PATCH"],
  ["/api/team-members", "PATCH"],
];
test("unauthenticated requests cannot read or mutate records", async (t) => {
  for (const [path, method] of [
    ...mutations,
    ["/api/players", "GET"],
    ["/api/analytics", "GET"],
  ])
    await t.test(`${method} ${path}`, async () => {
      assert.equal(
        (await call(path, method, method === "GET" ? undefined : {}, ""))
          .status,
        401,
      );
    });
});
test("viewer cannot bypass UI to invoke any mutation", async (t) => {
  for (const [path, method] of mutations)
    await t.test(`${method} ${path}`, async () => {
      assert.equal((await call(path, method, {}, viewer)).status, 403);
    });
});
test("viewer can read collection and analytics endpoints", async () => {
  for (const path of [
    "/api/players",
    "/api/teams",
    "/api/tournaments",
    "/api/matches",
    "/api/analytics?view=stats",
    "/api/analytics?view=leaderboard",
  ])
    assert.equal(
      (await call(path, "GET", undefined, viewer)).status,
      200,
      path,
    );
});
test("session endpoint identifies role and session storage contains only digest", async () => {
  const r = await (await call("/api/auth/session")).json();
  assert.equal(r.user.role, "admin");
  const row = (
    await pool.query(
      "SELECT token_hash,expires_at FROM app_session s JOIN app_user u USING(user_id) WHERE u.username=$1",
      [tag + "_admin"],
    )
  ).rows[0];
  assert.match(row.token_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(row.token_hash, admin.split("=")[1]);
  assert.ok(new Date(row.expires_at).valueOf() > Date.now());
});
test("invalid credentials rejected", async () => {
  assert.equal(
    (
      await call(
        "/api/auth/login",
        "POST",
        { username: tag + "_admin", password: "wrong" },
        "",
      )
    ).status,
    401,
  );
});
test("cross-origin mutations rejected", async () => {
  const r = await fetch(base + "/api/players", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.invalid",
      "Content-Type": "application/json",
      Cookie: admin,
    },
    body: "{}",
  });
  assert.equal(r.status, 403);
});
test("malformed JSON rejected", async () => {
  const r = await fetch(base + "/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: admin },
    body: "{",
  });
  assert.equal(r.status, 400);
});
test("incorrect content type rejected", async () => {
  const r = await fetch(base + "/api/players", {
    method: "POST",
    headers: { "Content-Type": "text/plain", Cookie: admin },
    body: "{}",
  });
  assert.equal(r.status, 415);
});
test("invalid scalar and missing fields rejected on all create endpoints", async () => {
  for (const x of [
    "players",
    "teams",
    "tournaments",
    "matches",
    "results",
    "stats",
    "participations",
    "team-members",
  ])
    assert.equal(
      (await call("/api/" + x, "POST", { username: 3 })).status,
      400,
      x,
    );
});
test("invalid IDs and missing records return 400 and 404", async () => {
  assert.equal((await call("/api/players/NaN", "DELETE", {})).status, 400);
  assert.equal((await call("/api/players/999999", "DELETE", {})).status, 404);
  assert.equal((await call("/api/teams/999999")).status, 404);
  assert.equal((await call("/api/analytics?tournament=NaN")).status, 400);
});
test("admin creates a player with real SQL record", async () => {
  const p = await json("/api/players", "POST", {
    username: tag + "_player",
    country: "India",
    role: "Carry",
    date_of_birth: "2001-01-01",
  });
  player = p.player_id;
  assert.ok(player);
  assert.equal(
    (
      await pool.query("SELECT username FROM PLAYER WHERE player_id=$1", [
        player,
      ])
    ).rows[0].username,
    tag + "_player",
  );
});
test("admin edits player and duplicate username returns 409", async () => {
  await json(
    `/api/players/${player}`,
    "PUT",
    {
      username: tag + "_player",
      country: "Japan",
      role: "Support",
      date_of_birth: "2001-01-01",
    },
    200,
  );
  await json(
    "/api/players",
    "POST",
    {
      username: tag + "_player",
      country: "India",
      role: "Carry",
      date_of_birth: "2001-01-01",
    },
    409,
  );
});
test("admin creates and updates two teams", async () => {
  teamA = (
    await json("/api/teams", "POST", {
      team_name: tag + "_A",
      country: "India",
    })
  ).team_id;
  teamB = (
    await json("/api/teams", "POST", {
      team_name: tag + "_B",
      country: "Japan",
    })
  ).team_id;
  await json(
    `/api/teams/${teamA}`,
    "PUT",
    { team_name: tag + "_A", country: "India", founded_date: "2020-01-01" },
    200,
  );
});
test("admin assigns a roster member and rejects overlap", async () => {
  await json("/api/team-members", "POST", {
    team_id: teamA,
    player_id: player,
    join_date: "2026-01-01",
  });
  await json(
    "/api/team-members",
    "POST",
    { team_id: teamB, player_id: player, join_date: "2026-02-01" },
    400,
  );
});
test("admin creates and updates tournament", async () => {
  tournament = (
    await json("/api/tournaments", "POST", {
      name: tag + "_cup",
      game_id: 1,
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      prize_pool: 1000,
    })
  ).tournament_id;
  await json(
    `/api/tournaments/${tournament}`,
    "PUT",
    {
      name: tag + "_cup",
      game_id: 1,
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      prize_pool: 2000,
    },
    200,
  );
});
test("admin registers both teams and duplicate registration returns 409", async () => {
  for (const team_id of [teamA, teamB])
    await json("/api/participations", "POST", {
      tournament_id: tournament,
      team_id,
    });
  await json(
    "/api/participations",
    "POST",
    { tournament_id: tournament, team_id: teamA },
    409,
  );
});
test("admin updates placement while invalid placement is rejected", async () => {
  await json(
    "/api/participations",
    "PATCH",
    { tournament_id: tournament, team_id: teamA, final_position: 1 },
    200,
  );
  await json(
    "/api/participations",
    "PATCH",
    { tournament_id: tournament, team_id: teamA, final_position: 99 },
    400,
  );
});
test("invalid schedule rolls back match insert", async () => {
  const before = (
    await pool.query("SELECT count(*) FROM MATCH WHERE tournament_id=$1", [
      tournament,
    ])
  ).rows[0].count;
  await json(
    "/api/matches",
    "POST",
    {
      tournament_id: tournament,
      match_date: "2026-11-10",
      round: "Final",
      team_a: teamA,
      team_b: 4,
    },
    400,
  );
  assert.equal(
    (
      await pool.query("SELECT count(*) FROM MATCH WHERE tournament_id=$1", [
        tournament,
      ])
    ).rows[0].count,
    before,
  );
});
test("admin schedules opponents atomically", async () => {
  match = (
    await json("/api/matches", "POST", {
      tournament_id: tournament,
      match_date: "2026-11-10",
      round: "Final",
      team_a: teamA,
      team_b: teamB,
    })
  ).match_id;
  assert.ok(match);
});
test("withdrawing a scheduled opponent is rejected", async () => {
  await json(
    "/api/participations",
    "DELETE",
    { tournament_id: tournament, team_id: teamA },
    400,
  );
});
test("invalid winner rejected and valid result updates standings", async () => {
  await json(
    "/api/results",
    "POST",
    {
      match_id: match,
      winning_team_id: 4,
      losing_team_id: teamB,
      score: "13-7",
    },
    400,
  );
  await json("/api/results", "POST", {
    match_id: match,
    winning_team_id: teamA,
    losing_team_id: teamB,
    score: "13-7",
  });
  assert.equal(
    (
      await pool.query(
        "SELECT points FROM tournament_standings WHERE tournament_id=$1 AND team_id=$2",
        [tournament, teamA],
      )
    ).rows[0].points,
    3,
  );
});
test("admin corrects result and audit records correction", async () => {
  await json("/api/results", "POST", {
    match_id: match,
    winning_team_id: teamB,
    losing_team_id: teamA,
    score: "13-8",
  });
  assert.equal(
    (
      await pool.query(
        "SELECT points FROM tournament_standings WHERE tournament_id=$1 AND team_id=$2",
        [tournament, teamB],
      )
    ).rows[0].points,
    3,
  );
  assert.ok(
    (
      await pool.query(
        "SELECT 1 FROM audit_log WHERE operation='UPDATE' AND new_value->>'match_id'=$1",
        [String(match)],
      )
    ).rowCount,
  );
});
test("invalid stats roll back participation and valid stats are recorded", async () => {
  await json(
    "/api/stats",
    "POST",
    {
      match_id: match,
      team_id: teamB,
      player_id: player,
      kills: 20,
      deaths: 5,
      assists: 4,
      damage: 1800,
    },
    400,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT 1 FROM PLAYED_BY WHERE match_id=$1 AND player_id=$2",
        [match, player],
      )
    ).rowCount,
    0,
  );
  await json("/api/stats", "POST", {
    match_id: match,
    team_id: teamA,
    player_id: player,
    kills: 20,
    deaths: 5,
    assists: 4,
    damage: 1800,
    rating: 1.2,
  });
});
test("negative statistics rejected with no mutation", async () => {
  await json(
    "/api/stats",
    "POST",
    {
      match_id: match,
      team_id: teamA,
      player_id: player,
      kills: -2,
      deaths: 5,
      assists: 4,
      damage: 1800,
    },
    400,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT kills FROM PLAYER_MATCH_STATS WHERE match_id=$1 AND player_id=$2",
        [match, player],
      )
    ).rows[0].kills,
    20,
  );
});
test("tournament performance and Redis sorted set leaderboard stay consistent", async () => {
  const first = await (
    await call(`/api/analytics?view=leaderboard&tournament=${tournament}`)
  ).json();
  const second = await (
    await call(`/api/analytics?view=leaderboard&tournament=${tournament}`)
  ).json();
  assert.equal(first.data[0].kills, 20);
  assert.deepEqual(second.data, first.data);
  assert.equal(second.source, "Redis");
  const stats = await (
    await call(`/api/analytics?view=stats&tournament=${tournament}`)
  ).json();
  assert.equal(stats.data[0].kd, 4);
});
test("cache hit changes to SQL miss after committed write", async () => {
  await call("/api/analytics");
  assert.equal((await (await call("/api/analytics")).json()).source, "Redis");
  await json(
    `/api/players/${player}`,
    "PUT",
    {
      username: tag + "_player",
      country: "Brazil",
      role: "Carry",
      date_of_birth: "2001-01-01",
    },
    200,
  );
  assert.equal(
    (await (await call("/api/analytics")).json()).source,
    "PostgreSQL",
  );
});
test("admin releases roster member preserving history", async () => {
  await json(
    "/api/team-members",
    "PATCH",
    {
      team_id: teamA,
      player_id: player,
      join_date: "2026-01-01",
      status: "inactive",
      leave_date: "2026-11-11",
    },
    200,
  );
  assert.equal(
    (
      await pool.query("SELECT status FROM TEAM_MEMBER WHERE player_id=$1", [
        player,
      ])
    ).rows[0].status,
    "inactive",
  );
});
test("authenticated detail reads return updated records", async () => {
  for (const [resource, id] of [
    ["players", player],
    ["teams", teamA],
    ["tournaments", tournament],
  ])
    assert.equal((await call(`/api/${resource}/${id}`)).status, 200);
});
test("CRUD delete sequence removes stats results matches registrations and entities", async () => {
  await json(
    "/api/stats",
    "DELETE",
    { match_id: match, player_id: player },
    200,
  );
  await json("/api/results", "DELETE", { match_id: match }, 200);
  await json(`/api/matches/${match}`, "DELETE", {}, 200);
  match = 0;
  await json(
    "/api/team-members",
    "DELETE",
    { team_id: teamA, player_id: player, join_date: "2026-01-01" },
    200,
  );
  for (const team_id of [teamA, teamB])
    await json(
      "/api/participations",
      "DELETE",
      { tournament_id: tournament, team_id },
      200,
    );
  await json(`/api/tournaments/${tournament}`, "DELETE", {}, 200);
  tournament = 0;
  for (const id of [teamA, teamB])
    await json(`/api/teams/${id}`, "DELETE", {}, 200);
  await json(`/api/players/${player}`, "DELETE", {}, 200);
  player = 0;
});
test("logout revokes session and prevents replay", async () => {
  const response = await call("/api/auth/logout", "POST", {}, viewer);
  assert.equal(response.status, 200);
  assert.equal(
    (await call("/api/players", "GET", undefined, viewer)).status,
    401,
  );
});
