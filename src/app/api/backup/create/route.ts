import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const tables = [
      'users', 'room_types', 'rooms', 'guests', 'bookings',
      'fb_categories', 'fb_items', 'fb_orders', 'fb_order_items',
      'financial_transactions', 'expense_categories', 'conference_halls',
      'conference_bookings', 'garden_bookings', 'camping_bookings',
      'pa_hires', 'vehicle_parking', 'visitor_log', 'security_incidents',
      'staff', 'staff_shifts', 'staff_leave', 'staff_wages',
      'inventory_categories', 'inventory_items', 'stock_transactions',
      'seasonal_pricing', 'pricing', 'discounts', 'price_changes',
      'activity_log', 'notifications', 'email_settings', 'email_logs',
      'audit_logs', 'utility_bills', 'guest_searches'
    ];

    let sql = '-- Hotel Management System Backup\n';
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      try {
        const { rows: data } = await pool.query(`SELECT * FROM ${table}`);
        if (data.length === 0) continue;

        sql += `-- ${table} (${data.length} rows)\n`;
        const cols = Object.keys(data[0]);

        for (const row of data) {
          const values = cols.map(c => {
            const v = row[c];
            if (v === null) return 'NULL';
            if (typeof v === 'number') return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sql += '\n';
      } catch { /* table may not exist */ }
    }

    const sizeKB = (Buffer.byteLength(sql) / 1024).toFixed(1);

    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().slice(0, 10)}.sql"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
