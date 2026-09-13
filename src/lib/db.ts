import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default {
  query: async (text: string, params?: unknown[]) => {
    const result = await sql(text, params ?? []);
    return { rows: result };
  },
  // For transactions / getClient compatibility
  connect: async () => {
    return {
      query: async (text: string, params?: unknown[]) => {
        const result = await sql(text, params ?? []);
        return { rows: result };
      },
      release: () => {},
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
    };
  },
};

export async function query(text: string, params?: unknown[]) {
  const result = await sql(text, params ?? []);
  return result;
}

export async function queryOne(text: string, params?: unknown[]) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function getClient() {
  return {
    query: async (text: string, params?: unknown[]) => {
      const result = await sql(text, params ?? []);
      return { rows: result };
    },
    release: () => {},
  };
}
