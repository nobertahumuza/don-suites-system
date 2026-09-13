import { NextResponse } from 'next/server';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { file } = await request.json();
    const filename = file.split(/[\\/]/).pop() || file;
    const filepath = join(process.cwd(), 'backups', filename);

    if (!existsSync(filepath) || !/^backup_.*\.sql$/.test(filename)) {
      return NextResponse.json({ success: false, error: 'Invalid backup file' });
    }

    unlinkSync(filepath);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
