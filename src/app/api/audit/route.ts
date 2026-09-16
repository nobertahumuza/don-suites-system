import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireRole(['admin']);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const filterUser = searchParams.get('user') || '';
    const filterEntity = searchParams.get('entity') || '';
    const filterAction = searchParams.get('action') || '';
    const filterDate = searchParams.get('date') || '';
    const filterSearch = searchParams.get('search') || '';
    const perPage = 30;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (filterUser) {
      where.user_id = parseInt(filterUser);
    }
    if (filterEntity) {
      where.entity_type = filterEntity;
    }
    if (filterAction) {
      where.action = filterAction;
    }
    if (filterDate) {
      const date = new Date(filterDate);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.created_at = { gte: date, lt: nextDate };
    }
    if (filterSearch) {
      where.OR = [
        { action: { contains: filterSearch, mode: 'insensitive' } },
        { entity_type: { contains: filterSearch, mode: 'insensitive' } },
      ];
    }

    const [total, logs, users, entityTypes, actionTypes] = await Promise.all([
      prisma.activity_log.count({ where }),
      prisma.activity_log.findMany({
        where,
        include: { users: { select: { full_name: true, username: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.users.findMany({
        select: { id: true, full_name: true, username: true },
        orderBy: { full_name: 'asc' },
      }),
      prisma.activity_log.findMany({
        select: { entity_type: true },
        distinct: ['entity_type'],
        orderBy: { entity_type: 'asc' },
      }),
      prisma.activity_log.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return NextResponse.json({
      logs,
      total,
      totalPages,
      page,
      users,
      entityTypes,
      actionTypes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
