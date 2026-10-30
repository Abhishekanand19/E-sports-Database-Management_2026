import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const { pool }=await import('../lib/db');
const { hashPassword }=await import('../lib/password');
const username=process.env.BOOTSTRAP_USERNAME?.trim().toLowerCase();
const password=process.env.BOOTSTRAP_PASSWORD;
const role=process.env.BOOTSTRAP_ROLE ?? 'admin';
try {
 if (!username || username.length>50 || !password || password.length<12 || password.length>256 || !['admin','viewer'].includes(role)) throw new Error('Set BOOTSTRAP_USERNAME, BOOTSTRAP_PASSWORD (12-256 characters), BOOTSTRAP_ROLE=admin|viewer');
 await pool.query('INSERT INTO app_user(username,password_hash,role) VALUES($1,$2,$3)',[username,await hashPassword(password),role]);
 console.log(`Created ${role} account ${username}`);
} finally { await pool.end(); }
