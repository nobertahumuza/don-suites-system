import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Use the create backup endpoint to download SQL dumps' }, { status: 404 });
}
