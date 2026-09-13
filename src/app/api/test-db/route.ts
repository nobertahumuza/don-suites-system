import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    return NextResponse.json({ ok: true, time: result.rows[0].time, db: result.rows[0].db });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 500 });
  }
}
