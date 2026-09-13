'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getConferenceBookings(filters?: { status?: string; date?: string }) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.status && ['confirmed', 'completed', 'cancelled'].includes(filters.status)) {
    conditions.push('cb.status = ?');
    params.push(filters.status);
  }
  if (filters?.date) {
    conditions.push('cb.event_date = ?');
    params.push(filters.date);
  }

  const where = conditions.join(' AND ');
  const [rows] = await pool.execute(
    `SELECT cb.*, ch.name as hall_name, ch.type as hall_type, ch.capacity
     FROM conference_bookings cb
     JOIN conference_halls ch ON cb.hall_id = ch.id
     WHERE ${where}
     ORDER BY cb.event_date DESC, cb.start_time DESC`,
    params
  );

  const bookings = rows as any[];
  let totalRevenue = 0;
  bookings.forEach((b: any) => { totalRevenue += Number(b.amount_paid); });

  return { bookings, totalBookings: bookings.length, totalRevenue };
}

export async function getConferenceHalls() {
  const [rows] = await pool.execute('SELECT * FROM conference_halls ORDER BY name');
  return rows as any[];
}

export async function getGardenBookings() {
  const [rows] = await pool.execute(
    `SELECT gb.*, g.full_name as guest_name
     FROM garden_bookings gb
     LEFT JOIN guests g ON gb.guest_id = g.id
     ORDER BY gb.event_date DESC`
  );
  return rows as any[];
}

export async function updateConferenceBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['completed', 'cancelled'].includes(status)) throw new Error('Invalid status');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE conference_bookings SET status = ? WHERE id = ? AND status = 'confirmed'`,
      [status, bookingId]
    );

    await conn.execute(
      `UPDATE conference_halls ch JOIN conference_bookings cb ON ch.id = cb.hall_id SET ch.status = 'available' WHERE cb.id = ?`,
      [bookingId]
    );

    await conn.commit();
    revalidatePath('/conference');
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function createConferenceBooking(data: {
  hall_id: number;
  guest_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  total_amount: number;
  amount_paid: number;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { hall_id, guest_name, event_date, start_time, end_time, purpose, total_amount, amount_paid, notes } = data;

  if (!guest_name) throw new Error('Guest name is required');
  if (!event_date) throw new Error('Event date is required');
  if (!hall_id) throw new Error('Hall is required');

  const [result] = await pool.execute(
    `INSERT INTO conference_bookings (hall_id, guest_name, event_date, start_time, end_time, purpose, total_amount, amount_paid, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
    [hall_id, guest_name, event_date, start_time, end_time, purpose || '', total_amount || 0, amount_paid || 0, notes || null, user.id]
  );

  await pool.execute("UPDATE conference_halls SET status = 'booked' WHERE id = ?", [hall_id]);

  revalidatePath('/conference');
  return { success: true, id: (result as any).insertId };
}

export async function createGardenBooking(data: {
  guest_name: string;
  guest_id?: number;
  event_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  total_amount: number;
  amount_paid: number;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { guest_name, guest_id, event_date, start_time, end_time, purpose, total_amount, amount_paid, notes } = data;

  if (!guest_name) throw new Error('Guest name is required');
  if (!event_date) throw new Error('Event date is required');

  const [result] = await pool.execute(
    `INSERT INTO garden_bookings (guest_id, guest_name, event_date, start_time, end_time, purpose, total_amount, amount_paid, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
    [guest_id || null, guest_name, event_date, start_time, end_time, purpose || '', total_amount || 0, amount_paid || 0, notes || null, user.id]
  );

  revalidatePath('/conference');
  return { success: true, id: (result as any).insertId };
}
