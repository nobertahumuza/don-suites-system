import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

export default pool;

export async function query(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text: string, params?: unknown[]) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function getClient() {
  return pool.connect();
}
