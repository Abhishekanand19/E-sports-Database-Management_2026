import { Pool } from "pg";

// One shared connection pool for all server code
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
