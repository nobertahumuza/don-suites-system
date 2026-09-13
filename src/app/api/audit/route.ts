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

    if (filterUser) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(parseInt(filterUser));
    }
    if (filterEntity) {
      conditions.push(`al.entity_type = $${params.length + 1}`);
      params.push(filterEntity);
    }
    if (filterAction) {
      conditions.push(`al.action = $${params.length + 1}`);
      params.push(filterAction);
    }
    if (filterDate) {
      conditions.push(`DATE(al.created_at) = $${params.length + 1}`);
      params.push(filterDate);
    }
    if (filterSearch) {
      conditions.push(`(al.action LIKE $${params.length + 1} OR al.entity_type LIKE $${params.length + 2})`);
      params.push(`%${filterSearch}%`, `%${filterSearch}%`);
    }

    const where = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) as c FROM activity_log al WHERE ${where}`,
      params
    );
    const total = Number(countResult.rows[0].c);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const logResult = await pool.query(
      `SELECT al.*, u.full_name, u.username
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT ${perPage} OFFSET ${offset}`,
      params
    );

    const userResult = await pool.query('SELECT id, full_name, username FROM users ORDER BY full_name');
    const entityResult = await pool.query('SELECT DISTINCT entity_type FROM activity_log ORDER BY entity_type');
    const actionResult = await pool.query('SELECT DISTINCT action FROM activity_log ORDER BY action');

    return NextResponse.json({
      logs: logResult.rows,
      total,
      totalPages,
      page,
      users: userResult.rows,
      entityTypes: entityResult.rows,
      actionTypes: actionResult.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
