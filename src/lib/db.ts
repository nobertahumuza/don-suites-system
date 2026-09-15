import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

export async function query(text: string, params?: unknown[]) {
  const result = await prisma.$queryRawUnsafe(text, ...(params ?? []));
  return { rows: result as Record<string, unknown>[] };
}

export async function queryOne(text: string, params?: unknown[]) {
  const rows = await query(text, params);
  return rows.rows[0] || null;
}

export async function getClient() {
  return prisma;
}
