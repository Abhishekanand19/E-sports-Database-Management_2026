import { getRedis } from "./redis";

// Every cache key in the app starts with this prefix, so one write can clear them all
const PREFIX = "esports:";

export type Sourced<T> = { data: T; source: "Redis" | "PostgreSQL" };

/**
 * Cache-aside pattern (from the slides):
 * 1. Check Redis for the key (cache hit -> return it)
 * 2. On a miss, query PostgreSQL
 * 3. Store the result in Redis with a TTL, then return it
 * If Redis is unavailable, the app silently falls back to PostgreSQL.
 */
export async function cachedQuery<T>(
  name: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<Sourced<T>> {
  const key = PREFIX + name;
  let redis: Awaited<ReturnType<typeof getRedis>> | undefined;

  try {
    redis = await getRedis();
    const hit = await redis.get(key);
    if (hit !== null) {
      return { data: JSON.parse(hit) as T, source: "Redis" };
    }
  } catch (err) {
    console.error("Cache read failed, using PostgreSQL:", err);
  }

  const data = await fetcher();

  try {
    await redis?.set(key, JSON.stringify(data), { EX: ttlSeconds });
  } catch (err) {
    console.error("Cache write failed:", err);
  }
  return { data, source: "PostgreSQL" };
}

// Called after every INSERT/UPDATE/DELETE so users never see stale data
export async function invalidateAll() {
  try {
    const redis = await getRedis();
    const keys = await redis.keys(PREFIX + "*");
    if (keys.length > 0) await redis.del(keys);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }
}
