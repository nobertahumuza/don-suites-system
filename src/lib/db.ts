import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default {
  query: async (text: string, params?: unknown[]) => {
    const rows = await sql.query(text, params ?? []);
    return { rows };
  },
  connect: async () => ({
    query: async (text: string, params?: unknown[]) => {
      const rows = await sql.query(text, params ?? []);
      return { rows };
    },
    release: () => {},
  }),
};

export async function query(text: string, params?: unknown[]) {
  return await sql.query(text, params ?? []);
}

export async function queryOne(text: string, params?: unknown[]) {
  const rows = await sql.query(text, params ?? []);
  return rows[0] || null;
}

export async function getClient() {
  return {
    query: async (text: string, params?: unknown[]) => {
      const rows = await sql.query(text, params ?? []);
      return { rows };
    },
    release: () => {},
  };
}
