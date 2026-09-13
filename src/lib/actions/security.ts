'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getIncidents() {
  const [rows] = await pool.execute(
    `SELECT si.*, u.full_name as reporter_name
     FROM security_incidents si
     LEFT JOIN users u ON si.reported_by_user = u.id
     ORDER BY si.created_at DESC`
  );
  return rows as any[];
}

export async function getIncidentStats() {
  const [openCount] = await pool.execute("SELECT COUNT(*) as c FROM security_incidents WHERE status = 'open'");
  const [todayCount] = await pool.execute("SELECT COUNT(*) as c FROM security_incidents WHERE DATE(created_at) = CURDATE()");
  const [totalCount] = await pool.execute("SELECT COUNT(*) as c FROM security_incidents");

  return {
    openCount: (openCount as any[])[0].c,
    todayCount: (todayCount as any[])[0].c,
    totalCount: (totalCount as any[])[0].c,
  };
}

export async function createIncident(data: {
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  reported_by: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { incident_type, severity, location, description, reported_by } = data;

  if (!description) throw new Error('Description is required');
  if (!incident_type) throw new Error('Incident type is required');

  await pool.execute(
    `INSERT INTO security_incidents (incident_type, severity, location, description, reported_by, status, reported_by_user)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    [incident_type, severity || 'low', location || '', description, reported_by || user.full_name, user.id]
  );

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function updateIncidentStatus(incidentId: number, newStatus: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['open', 'investigating', 'resolved', 'closed'].includes(newStatus)) throw new Error('Invalid status');

  await pool.execute(
    'UPDATE security_incidents SET status = ? WHERE id = ?',
    [newStatus, incidentId]
  );

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function getVisitors() {
  const [todayVisitors] = await pool.execute(
    "SELECT * FROM visitor_log WHERE DATE(time_in) = CURDATE() ORDER BY time_in DESC"
  );
  const [activeVisitors] = await pool.execute(
    "SELECT * FROM visitor_log WHERE time_out IS NULL ORDER BY time_in DESC"
  );
  const [recentVisitors] = await pool.execute(
    "SELECT * FROM visitor_log ORDER BY time_in DESC LIMIT 50"
  );
  const [totalResult] = await pool.execute("SELECT COUNT(*) as c FROM visitor_log");

  return {
    todayVisitors: todayVisitors as any[],
    activeVisitors: activeVisitors as any[],
    recentVisitors: recentVisitors as any[],
    stats: {
      today: (todayVisitors as any[]).length,
      active: (activeVisitors as any[]).length,
      total: (totalResult as any[])[0].c,
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

  await pool.execute(
    `INSERT INTO visitor_log (visitor_name, visitor_phone, visitor_id_number, purpose, visiting_guest, room_number, vehicle_number, time_in, logged_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [visitor_name, visitor_phone || '', visitor_id_number || '', purpose || '', visiting_guest || '', room_number || '', vehicle_number || '', user.id]
  );

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function checkoutVisitor(visitorId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute(
    'UPDATE visitor_log SET time_out = NOW() WHERE id = ?',
    [visitorId]
  );

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function getPatrolLogs() {
  const [rows] = await pool.execute(
    `SELECT si.*, u.full_name as reported_by_name
     FROM security_incidents si
     LEFT JOIN users u ON si.reported_by = u.id
     WHERE si.incident_type = 'patrol'
     ORDER BY si.created_at DESC LIMIT 50`
  );
  return rows as any[];
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

  await pool.execute(
    `INSERT INTO security_incidents (incident_type, severity, location, description, reported_by, status, created_at)
     VALUES ('patrol', ?, ?, ?, ?, 'open', NOW())`,
    [status, area, notes || '', user.id]
  );

  revalidatePath('/security/patrol');
  return { success: true };
}
