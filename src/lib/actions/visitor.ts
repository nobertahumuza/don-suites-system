'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function logVisitor(data: {
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber?: string;
  purpose?: string;
  visitingGuest?: string;
  roomNumber?: string;
  vehicleNumber?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const timeIn = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const result = await pool.query(
    `INSERT INTO visitor_log (visitor_name, visitor_phone, visitor_id_number, purpose, visiting_guest, room_number, vehicle_number, time_in, logged_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      data.visitorName,
      data.visitorPhone || '',
      data.visitorIdNumber || '',
      data.purpose || '',
      data.visitingGuest || '',
      data.roomNumber || '',
      data.vehicleNumber || '',
      timeIn,
      user.id,
    ]
  );

  revalidatePath('/front-desk');
  return { success: true, id: result.rows[0].id };
}

export async function checkOutVisitor(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const timeOut = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await pool.query('UPDATE visitor_log SET time_out = $1 WHERE id = $2', [timeOut, id]);

  revalidatePath('/front-desk');
  return { success: true };
}

export async function getActiveVisitors() {
  const result = await pool.query(
    `SELECT v.*, u.full_name as logged_by_name
     FROM visitor_log v
     LEFT JOIN users u ON v.logged_by = u.id
     WHERE v.time_out IS NULL
     ORDER BY v.time_in DESC`
  );
  return result.rows as any[];
}

export async function getTodayVisitors() {
  const result = await pool.query(
    `SELECT v.*
     FROM visitor_log v
     WHERE DATE(v.time_in) = CURRENT_DATE
     ORDER BY v.time_in DESC`
  );
  return result.rows as any[];
}

export async function getRecentFbOrders(limit = 15) {
  const result = await pool.query(
    `SELECT o.*, u.full_name as served_by_name
     FROM fb_orders o
     LEFT JOIN users u ON o.served_by = u.id
     ORDER BY o.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows as any[];
}

export async function getOrderItems(orderId: number) {
  const result = await pool.query(
    `SELECT fi.name, foi.quantity
     FROM fb_order_items foi
     JOIN fb_items fi ON foi.fb_item_id = fi.id
     WHERE foi.order_id = $1`,
    [orderId]
  );
  return result.rows as any[];
}

export async function getRoomStatus() {
  const result = await pool.query(
    `SELECT r.room_number, rt.name as type_name, r.status
     FROM rooms r
     LEFT JOIN room_types rt ON r.room_type_id = rt.id
     ORDER BY r.room_number`
  );
  return result.rows as any[];
}

export async function getFrontDeskStats() {
  const activeCountResult = await pool.query(
    'SELECT COUNT(*) as c FROM visitor_log WHERE time_out IS NULL'
  );
  const todayCountResult = await pool.query(
    'SELECT COUNT(*) as c FROM visitor_log WHERE DATE(time_in) = CURRENT_DATE'
  );
  const todayOrdersResult = await pool.query(
    'SELECT COUNT(*) as c FROM fb_orders WHERE DATE(created_at) = CURRENT_DATE'
  );
  const todayRevenueResult = await pool.query(
    "SELECT COALESCE(SUM(total),0) as c FROM fb_orders WHERE payment_status='paid' AND DATE(created_at) = CURRENT_DATE"
  );
  const pendingPaymentsResult = await pool.query(
    "SELECT COUNT(*) as c FROM fb_orders WHERE payment_status='unpaid'"
  );

  const rooms = await getRoomStatus();
  const statusCounts = { available: 0, occupied: 0, reserved: 0, cleaning: 0 };
  for (const r of rooms as any[]) {
    if (r.status in statusCounts) {
      (statusCounts as any)[r.status]++;
    }
  }

  return {
    activeVisitors: Number(activeCountResult.rows[0].c),
    todayVisitors: Number(todayCountResult.rows[0].c),
    todayOrders: Number(todayOrdersResult.rows[0].c),
    todayRevenue: Number(todayRevenueResult.rows[0].c),
    pendingPayments: Number(pendingPaymentsResult.rows[0].c),
    rooms: statusCounts,
  };
}
