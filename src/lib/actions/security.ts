'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getIncidents() {
  const result = await pool.query(
    `SELECT si.*, u.full_name as reporter_name
     FROM security_incidents si
     LEFT JOIN users u ON si.reported_by_user = u.id
     ORDER BY si.created_at DESC`
  );
  return result.rows as any[];
}

export async function getIncidentStats() {
  const openResult = await pool.query("SELECT COUNT(*) as c FROM security_incidents WHERE status = 'open'");
  const todayResult = await pool.query("SELECT COUNT(*) as c FROM security_incidents WHERE DATE(created_at) = CURRENT_DATE");
  const totalResult = await pool.query("SELECT COUNT(*) as c FROM security_incidents");

  return {
    openCount: openResult.rows[0].c,
    todayCount: todayResult.rows[0].c,
    totalCount: totalResult.rows[0].c,
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

  await pool.query(
    `INSERT INTO security_incidents (incident_type, severity, location, description, reported_by, status, reported_by_user)
     VALUES ($1, $2, $3, $4, $5, 'open', $6)`,
    [incident_type, severity || 'low', location || '', description, reported_by || user.full_name, user.id]
  );

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function updateIncidentStatus(incidentId: number, newStatus: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['open', 'investigating', 'resolved', 'closed'].includes(newStatus)) throw new Error('Invalid status');

  await pool.query(
    'UPDATE security_incidents SET status = $1 WHERE id = $2',
    [newStatus, incidentId]
  );

  revalidatePath('/security/incidents');
  return { success: true };
}

export async function getVisitors() {
  const todayResult = await pool.query(
    "SELECT * FROM visitor_log WHERE DATE(time_in) = CURRENT_DATE ORDER BY time_in DESC"
  );
  const activeResult = await pool.query(
    "SELECT * FROM visitor_log WHERE time_out IS NULL ORDER BY time_in DESC"
  );
  const recentResult = await pool.query(
    "SELECT * FROM visitor_log ORDER BY time_in DESC LIMIT 50"
  );
  const totalResult = await pool.query("SELECT COUNT(*) as c FROM visitor_log");

  return {
    todayVisitors: todayResult.rows as any[],
    activeVisitors: activeResult.rows as any[],
    recentVisitors: recentResult.rows as any[],
    stats: {
      today: todayResult.rows.length,
      active: activeResult.rows.length,
      total: totalResult.rows[0].c,
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

  await pool.query(
    `INSERT INTO visitor_log (visitor_name, visitor_phone, visitor_id_number, purpose, visiting_guest, room_number, vehicle_number, time_in, logged_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
    [visitor_name, visitor_phone || '', visitor_id_number || '', purpose || '', visiting_guest || '', room_number || '', vehicle_number || '', user.id]
  );

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function checkoutVisitor(visitorId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query(
    'UPDATE visitor_log SET time_out = NOW() WHERE id = $1',
    [visitorId]
  );

  revalidatePath('/security/visitors');
  return { success: true };
}

export async function getPatrolLogs() {
  const result = await pool.query(
    `SELECT si.*, u.full_name as reported_by_name
     FROM security_incidents si
     LEFT JOIN users u ON si.reported_by = u.id
     WHERE si.incident_type = 'patrol'
     ORDER BY si.created_at DESC LIMIT 50`
  );
  return result.rows as any[];
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

  await pool.query(
    `INSERT INTO security_incidents (incident_type, severity, location, description, reported_by, status, created_at)
     VALUES ('patrol', $1, $2, $3, $4, 'open', NOW())`,
    [status, area, notes || '', user.id]
  );

  revalidatePath('/security/patrol');
  return { success: true };
}
