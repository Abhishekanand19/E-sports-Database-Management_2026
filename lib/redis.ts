import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));

// Connect once; concurrent callers share the same connection attempt
let connectPromise: Promise<typeof redis> | null = null;

export function getRedis() {
  if (!connectPromise) {
    connectPromise = redis
      .connect()
      .then(() => redis)
      .catch((err) => {
        connectPromise = null; // allow a retry on the next request
        throw err;
      });
  }
  return connectPromise;
}
