'use server';

import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getIncidents() {
  const incidents = await prisma.security_incidents.findMany({
    include: { users: true },
    orderBy: { created_at: 'desc' },
  });
  return incidents.map((i) => ({ ...i, reporter_name: i.users?.full_name ?? null }));
}

export async function getIncidentStats() {
  const openCount = await prisma.security_incidents.count({ where: { status: 'open' } });
  const totalCount = await prisma.security_incidents.count();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayCount = await prisma.security_incidents.count({
    where: { created_at: { gte: today, lt: tomorrow } },
  });

  return { openCount, todayCount, totalCount };
}

export async function createIncident(data: {
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  reported_by: string;
}) {
  const user = await requireRole(['admin', 'security']);

  const { incident_type, severity, location, description, reported_by } = data;

  if (!description) throw new Error('Description is required');
  if (!incident_type) throw new Error('Incident type is required');

  await prisma.security_incidents.create({
    data: {
      incident_type,
      severity: severity || 'low',
      location: location || '',
      description,
      reported_by: reported_by || user.full_name,
      status: 'open',
      reported_by_user: user.id,
    },
  });

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function updateIncidentStatus(incidentId: number, newStatus: string) {
  const user = await requireRole(['admin', 'security']);

  if (!['open', 'investigating', 'resolved', 'closed'].includes(newStatus)) throw new Error('Invalid status');

  await prisma.security_incidents.update({
    where: { id: incidentId },
    data: { status: newStatus },
  });

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function getVisitors() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayVisitors, activeVisitors, recentVisitors, total] = await Promise.all([
    prisma.visitor_log.findMany({
      where: { time_in: { gte: today, lt: tomorrow } },
      orderBy: { time_in: 'desc' },
    }),
    prisma.visitor_log.findMany({
      where: { time_out: null },
      orderBy: { time_in: 'desc' },
    }),
    prisma.visitor_log.findMany({
      orderBy: { time_in: 'desc' },
      take: 50,
    }),
    prisma.visitor_log.count(),
  ]);

  return {
    todayVisitors,
    activeVisitors,
    recentVisitors,
    stats: {
      today: todayVisitors.length,
      active: activeVisitors.length,
      total,
    },
  };
}

export async function logVisitor(data: {
  visitor_name: string;
  visitor_phone: string;
  visitor_id_number: string;
  purpose: string;
  visiting_guest: string;
  room_number: string;
  vehicle_number: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { visitor_name, visitor_phone, visitor_id_number, purpose, visiting_guest, room_number, vehicle_number } = data;

  if (!visitor_name) throw new Error('Visitor name is required');

  await prisma.visitor_log.create({
    data: {
      visitor_name,
      visitor_phone: visitor_phone || '',
      visitor_id_number: visitor_id_number || '',
      purpose: purpose || '',
      visiting_guest: visiting_guest || '',
      room_number: room_number || '',
      vehicle_number: vehicle_number || '',
      time_in: new Date(),
      logged_by: user.id,
    },
  });

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function checkoutVisitor(visitorId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.visitor_log.update({
    where: { id: visitorId },
    data: { time_out: new Date() },
  });

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function getPatrolLogs() {
  const logs = await prisma.security_incidents.findMany({
    where: { incident_type: 'patrol' },
    include: { users: true },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  return logs.map((l) => ({ ...l, reported_by_name: l.users?.full_name ?? null }));
}

export async function logPatrol(data: {
  area: string;
  status: string;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { area, status, notes } = data;

  if (!area) throw new Error('Area is required');
  if (!status) throw new Error('Status is required');

  await prisma.security_incidents.create({
    data: {
      incident_type: 'patrol',
      severity: status,
      location: area,
      description: notes || '',
      reported_by_user: user.id,
      status: 'open',
    },
  });

  revalidatePath('/security/patrol');
  return { success: true };
}
