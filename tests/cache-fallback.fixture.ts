import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const { cachedQuery } = await import("../lib/cache");
const { pool } = await import("../lib/db");
const start = Date.now();
try {
  const result = await cachedQuery(
    "fallback-test",
    60,
    async () =>
      (await pool.query("SELECT count(*)::int AS count FROM PLAYER")).rows[0]
        .count,
  );
  console.log(JSON.stringify({ ...result, elapsed: Date.now() - start }));
} finally {
  await pool.end();
}
