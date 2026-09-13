import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backupDir = join(process.cwd(), 'backups');
    let files: any[] = [];
    try {
      const entries = readdirSync(backupDir).filter((f) => f.startsWith('backup_') && f.endsWith('.sql'));
      files = entries.map((name) => {
        const filePath = join(backupDir, name);
        const stat = statSync(filePath);
        const sizeKB = stat.size / 1024;
        const sizeDisplay = sizeKB >= 1024 ? (sizeKB / 1024).toFixed(2) + ' MB' : sizeKB.toFixed(1) + ' KB';
        return {
          name,
          size: stat.size,
          sizeDisplay,
          date: stat.mtime.getTime(),
          dateDisplay: stat.mtime.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }),
        };
      });
      files.sort((a: any, b: any) => b.date - a.date);
    } catch { /* directory may not exist */ }

    const totalSize = files.reduce((sum: number, f: any) => sum + f.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2) + ' MB';
    const diskTotal = os.totalmem() / (1024 * 1024 * 1024);
    const diskFree = os.freemem() / (1024 * 1024 * 1024);

    return NextResponse.json({
      backups: files,
      stats: {
        total: files.length,
        totalSize: totalSizeMB,
        diskFree: diskFree.toFixed(1) + ' GB',
        diskTotal: diskTotal.toFixed(1) + ' GB',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
