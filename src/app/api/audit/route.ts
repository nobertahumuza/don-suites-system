import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const filterUser = searchParams.get('user') || '';
    const filterEntity = searchParams.get('entity') || '';
    const filterAction = searchParams.get('action') || '';
    const filterDate = searchParams.get('date') || '';
    const filterSearch = searchParams.get('search') || '';
    const perPage = 30;
    const offset = (page - 1) * perPage;

    const conditions = ['1=1'];
    const params: any[] = [];
    const types: string[] = [];

    if (filterUser) {
      conditions.push('al.user_id = ?');
      params.push(parseInt(filterUser));
      types.push('i');
    }
    if (filterEntity) {
      conditions.push('al.entity_type = ?');
      params.push(filterEntity);
      types.push('s');
    }
    if (filterAction) {
      conditions.push('al.action = ?');
      params.push(filterAction);
      types.push('s');
    }
    if (filterDate) {
      conditions.push('DATE(al.created_at) = ?');
      params.push(filterDate);
      types.push('s');
    }
    if (filterSearch) {
      conditions.push('(al.action LIKE ? OR al.entity_type LIKE ?)');
      params.push(`%${filterSearch}%`, `%${filterSearch}%`);
      types.push('ss');
    }

    const where = conditions.join(' AND ');

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as c FROM activity_log al WHERE ${where}`,
      params
    );
    const total = (countRows as any[])[0].c;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const [logRows] = await pool.execute(
      `SELECT al.*, u.full_name, u.username
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT ${perPage} OFFSET ${offset}`,
      params
    );

    const [userRows] = await pool.execute('SELECT id, full_name, username FROM users ORDER BY full_name');
    const [entityRows] = await pool.execute('SELECT DISTINCT entity_type FROM activity_log ORDER BY entity_type');
    const [actionRows] = await pool.execute('SELECT DISTINCT action FROM activity_log ORDER BY action');

    return NextResponse.json({
      logs: logRows,
      total,
      totalPages,
      page,
      users: userRows,
      entityTypes: entityRows,
      actionTypes: actionRows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
