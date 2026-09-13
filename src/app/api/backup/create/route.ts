import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const backupDir = join(process.cwd(), 'backups');
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '-');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const filename = `backup_${dateStr}_${timeStr}.sql`;
    const filepath = join(backupDir, filename);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASS || '';
    const dbName = process.env.DB_NAME || 'hotel_management';

    const mysqlPath = process.platform === 'win32'
      ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe'
      : 'mysqldump';

    const cmd = `"${mysqlPath}" --user=${dbUser} --password=${dbPass} --host=${dbHost} ${dbName} > "${filepath}" 2>&1`;

    try {
      execSync(cmd, { timeout: 60000 });
    } catch { /* may still create the file */ }

    if (!existsSync(filepath) || statSync(filepath).size === 0) {
      return NextResponse.json({ success: false, error: 'Backup failed - empty file created' });
    }

    const size = statSync(filepath).size;
    const sizeKB = (size / 1024).toFixed(1) + ' KB';

    return NextResponse.json({
      success: true,
      filename,
      size: sizeKB,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
