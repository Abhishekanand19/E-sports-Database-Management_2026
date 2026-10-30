import { Pool } from "pg";

// One shared connection pool for all server code
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
});
