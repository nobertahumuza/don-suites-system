import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sql } = (await request.json()) as { sql: string };
    if (!sql) return NextResponse.json({ success: false, error: 'No SQL provided' });

    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    let executed = 0;

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        await prisma.$executeRawUnsafe(trimmed);
        executed++;
      } catch { /* skip individual errors */ }
    }

    return NextResponse.json({ success: true, message: `Executed ${executed} statements` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
