import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    if (!file) return NextResponse.json({ error: 'No file specified' }, { status: 400 });

    const filename = file.split(/[\\/]/).pop() || file;
    const filepath = join(process.cwd(), 'backups', filename);

    if (!existsSync(filepath) || !/^backup_.*\.sql$/.test(filename)) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 404 });
    }

    const content = readFileSync(filepath);
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(content.length),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
