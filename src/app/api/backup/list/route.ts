import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    backups: [],
    stats: { total: 0, totalSize: '0 KB', diskFree: 'N/A', diskTotal: 'N/A' },
    message: 'Backups are managed through Neon dashboard when deployed on Vercel',
  });
}
