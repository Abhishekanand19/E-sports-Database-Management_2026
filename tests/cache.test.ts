import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { spawnSync } from "node:child_process";
const { cachedQuery, revisionKey } = await import("../lib/cache");
const { getRedis } = await import("../lib/redis");
const { pool } = await import("../lib/db");
const { leaderboard } = await import("../lib/leaderboard");
const prefix = `tests:${Date.now()}`;
after(async () => {
  await (await getRedis()).quit();
  await pool.end();
});
test("real Redis responds to PING", async () =>
  assert.equal(await (await getRedis()).ping(), "PONG"));
test("cache aside miss then hit avoids duplicate fetch", async () => {
  let calls = 0;
  const first = await cachedQuery(prefix + ":hit", 60, async () => ++calls);
  const second = await cachedQuery(prefix + ":hit", 60, async () => ++calls);
  assert.equal(first.source, "PostgreSQL");
  assert.equal(second.source, "Redis");
  assert.equal(second.data, 1);
  assert.equal(calls, 1);
});
test("TTL expires and refreshes authoritative data", async () => {
  await cachedQuery(prefix + ":ttl", 1, async () => 1);
  assert.ok(await (await getRedis()).ttl(await revisionKey(prefix + ":ttl")));
  await wait(1100);
  const r = await cachedQuery(prefix + ":ttl", 1, async () => 2);
  assert.equal(r.source, "PostgreSQL");
  assert.equal(r.data, 2);
});
test("committed SQL write advances generation atomically", async () => {
  const name = prefix + ":write";
  await cachedQuery(name, 60, async () => 1);
  const old = await revisionKey(name);
  await pool.query("UPDATE PLAYER SET country=country WHERE player_id=1");
  assert.notEqual(await revisionKey(name), old);
  const result = await cachedQuery(name, 60, async () => 2);
  assert.equal(result.source, "PostgreSQL");
  assert.equal(result.data, 2);
});
test("corrupt JSON recovers from SQL fetch", async () => {
  const name = prefix + ":corrupt";
  await (await getRedis()).set(await revisionKey(name), "{", { EX: 60 });
  const r = await cachedQuery(name, 60, async () => 42);
  assert.equal(r.data, 42);
  assert.equal(r.source, "PostgreSQL");
});
test("advanced NoSQL sorted set ranks match SQL and have TTL", async () => {
  const a = await leaderboard(1),
    b = await leaderboard(1);
  assert.deepEqual(a.data, b.data);
  assert.equal(b.source, "Redis");
  assert.equal(b.data[0].username, "ShadowAce");
  assert.equal(b.data[0].kills, 40);
  const redis = await getRedis(),
    key = await revisionKey("leaderboard:1");
  assert.equal(await redis.type(key), "zset");
  assert.ok((await redis.ttl(key)) > 0);
});
test("unavailable Redis falls back to PostgreSQL within bounded time", () => {
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/cache-fallback.fixture.ts"],
    {
      cwd: process.cwd(),
      env: { ...process.env, REDIS_URL: "redis://127.0.0.1:1" },
      encoding: "utf8",
      timeout: 10000,
    },
  );
  assert.equal(child.status, 0, child.stderr);
  const r = JSON.parse(child.stdout.trim());
  assert.equal(r.source, "PostgreSQL");
  assert.ok(r.elapsed < 1500);
  assert.ok(r.data >= 6);
});
