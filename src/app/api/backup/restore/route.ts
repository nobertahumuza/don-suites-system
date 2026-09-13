import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { file } = await request.json();
    const backupDir = join(process.cwd(), 'backups');
    const filename = basename(file);
    const filepath = join(backupDir, filename);

    if (!existsSync(filepath) || !/^backup_.*\.sql$/.test(filename)) {
      return NextResponse.json({ success: false, error: 'Invalid backup file' });
    }

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASS || '';
    const dbName = process.env.DB_NAME || 'hotel_management';

    const mysqlPath = process.platform === 'win32'
      ? 'C:\\xampp\\mysql\\bin\\mysql.exe'
      : 'mysql';

    const cmd = `"${mysqlPath}" --user=${dbUser} --password=${dbPass} --host=${dbHost} ${dbName} < "${filepath}" 2>&1`;

    try {
      execSync(cmd, { timeout: 120000 });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Restore failed: ' + (e.message || 'Unknown error') });
    }

    return NextResponse.json({ success: true, message: `Database restored from: ${filename}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function basename(path: string) {
  return path.split(/[\\/]/).pop() || path;
}
