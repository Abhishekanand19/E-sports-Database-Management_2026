import { createHash } from "node:crypto";
import { getRedis } from "./redis";
import { pool } from "./db";
export type Sourced<T> = { data: T; source: "Redis" | "PostgreSQL" };
export const cachePrefix =
  process.env.CACHE_PREFIX ??
  `esports:${createHash("sha256")
    .update(process.env.DATABASE_URL ?? "unset")
    .digest("hex")
    .slice(0, 12)}:`;
export async function revisionKey(name: string) {
  const { rows } = await pool.query(
    "SELECT version FROM cache_revision WHERE singleton",
  );
  return `${cachePrefix}${rows[0].version}:${createHash("sha256").update(name).digest("hex")}`;
}
export async function cachedQuery<T>(
  name: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<Sourced<T>> {
  const key = await revisionKey(name);
  try {
    const value = await (await getRedis()).get(key);
    if (value !== null)
      return { data: JSON.parse(value) as T, source: "Redis" };
  } catch {}
  const data = await fetcher();
  try {
    await (await getRedis()).set(key, JSON.stringify(data), { EX: ttl });
  } catch {}
  return { data, source: "PostgreSQL" };
}
