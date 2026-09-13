'use server';

import pool, { getClient } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getConferenceBookings(filters?: { status?: string; date?: string }) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.status && ['confirmed', 'completed', 'cancelled'].includes(filters.status)) {
    conditions.push(`cb.status = $${params.length + 1}`);
    params.push(filters.status);
  }
  if (filters?.date) {
    conditions.push(`cb.event_date = $${params.length + 1}`);
    params.push(filters.date);
  }

  const where = conditions.join(' AND ');
  const result = await pool.query(
    `SELECT cb.*, ch.name as hall_name, ch.type as hall_type, ch.capacity
     FROM conference_bookings cb
     JOIN conference_halls ch ON cb.hall_id = ch.id
     WHERE ${where}
     ORDER BY cb.event_date DESC, cb.start_time DESC`,
    params
  );

  const bookings = result.rows as any[];
  let totalRevenue = 0;
  bookings.forEach((b: any) => { totalRevenue += Number(b.amount_paid); });

  return { bookings, totalBookings: bookings.length, totalRevenue };
}

export async function getConferenceHalls() {
  const result = await pool.query('SELECT * FROM conference_halls ORDER BY name');
  return result.rows as any[];
}

export async function getGardenBookings() {
  const result = await pool.query(
    `SELECT gb.*, g.full_name as guest_name
     FROM garden_bookings gb
     LEFT JOIN guests g ON gb.guest_id = g.id
     ORDER BY gb.event_date DESC`
  );
  return result.rows as any[];
}

export async function updateConferenceBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['completed', 'cancelled'].includes(status)) throw new Error('Invalid status');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE conference_bookings SET status = $1 WHERE id = $2 AND status = 'confirmed'`,
      [status, bookingId]
    );

    await client.query(
      `UPDATE conference_halls SET status = 'available' WHERE id = (SELECT hall_id FROM conference_bookings WHERE id = $1)`,
      [bookingId]
    );

    await client.query('COMMIT');
    revalidatePath('/conference');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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

  const result = await pool.query(
    `INSERT INTO conference_bookings (hall_id, guest_name, event_date, start_time, end_time, purpose, total_amount, amount_paid, status, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, $10) RETURNING id`,
    [hall_id, guest_name, event_date, start_time, end_time, purpose || '', total_amount || 0, amount_paid || 0, notes || null, user.id]
  );

  await pool.query("UPDATE conference_halls SET status = 'booked' WHERE id = $1", [hall_id]);

  revalidatePath('/conference');
  return { success: true, id: result.rows[0].id };
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

  const result = await pool.query(
    `INSERT INTO garden_bookings (guest_id, guest_name, event_date, start_time, end_time, purpose, total_amount, amount_paid, status, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, $10) RETURNING id`,
    [guest_id || null, guest_name, event_date, start_time, end_time, purpose || '', total_amount || 0, amount_paid || 0, notes || null, user.id]
  );

  revalidatePath('/conference');
  return { success: true, id: result.rows[0].id };
}
