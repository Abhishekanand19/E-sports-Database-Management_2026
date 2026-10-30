import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(3472026)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = ['schema.sql', ...(await readdir('db/migrations')).sort().map(f => `migrations/${f}`)];
  if (process.argv.includes('--seed')) files.push('seed.sql');
  for (const file of files) {
    if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [file])).rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(await readFile(`db/${file}`, 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (err) { await client.query('ROLLBACK'); throw err; }
  }
} finally { await client.query('SELECT pg_advisory_unlock(3472026)'); client.release(); await pool.end(); }
