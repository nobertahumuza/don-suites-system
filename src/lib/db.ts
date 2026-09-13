import { neon } from '@neondatabase/serverless';

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

export default {
  query: async (text: string, params?: unknown[]) => {
    const sql = getSql();
    const rows = await sql.query(text, params ?? []);
    return { rows };
  },
  connect: async () => {
    const sql = getSql();
    return {
      query: async (text: string, params?: unknown[]) => {
        const rows = await sql.query(text, params ?? []);
        return { rows };
      },
      release: () => {},
    };
  },
};

export async function query(text: string, params?: unknown[]) {
  const sql = getSql();
  return await sql.query(text, params ?? []);
}

export async function queryOne(text: string, params?: unknown[]) {
  const sql = getSql();
  const rows = await sql.query(text, params ?? []);
  return rows[0] || null;
}

export async function getClient() {
  const sql = getSql();
  return {
    query: async (text: string, params?: unknown[]) => {
      const rows = await sql.query(text, params ?? []);
      return { rows };
    },
    release: () => {},
  };
}
