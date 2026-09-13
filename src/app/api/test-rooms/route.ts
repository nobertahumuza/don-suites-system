import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM rooms');
    return NextResponse.json({ ok: true, rooms: result.rows[0].total, env: process.env.DATABASE_URL?.substring(0, 30) });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message, stack: error.stack?.substring(0, 500) }, { status: 500 });
  }
}
