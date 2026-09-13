'use server';

import pool, { getClient } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createBooking(data: {
  guest_full_name: string;
  guest_phone: string;
  guest_email: string;
  guest_id_type: string;
  guest_id_number: string;
  guest_nationality: string;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  amount: number;
  payment_method: string;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const {
    guest_full_name,
    guest_phone,
    guest_email,
    guest_id_type,
    guest_id_number,
    guest_nationality,
    room_id,
    check_in_date,
    check_out_date,
    amount,
    payment_method,
    notes,
  } = data;

  if (!guest_full_name) throw new Error('Guest name is required');
  if (!guest_phone) throw new Error('Phone number is required');
  if (!room_id) throw new Error('Room is required');
  if (!check_in_date) throw new Error('Check-in date is required');
  if (!check_out_date) throw new Error('Check-out date is required');
  if (check_out_date <= check_in_date) throw new Error('Check-out must be after check-in');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const roomResult = await client.query(
      "SELECT r.*, rt.price, rt.name as type_name FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = $1 AND r.status = 'available'",
      [room_id]
    );
    const rooms = roomResult.rows;
    if (rooms.length === 0) throw new Error('Selected room is not available');
    const room = rooms[0];

    const ci = new Date(check_in_date);
    const co = new Date(check_out_date);
    const nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    const total_amount = amount > 0 ? amount : nights * (room.price as number);

    const guestResult = await client.query(
      'INSERT INTO guests (full_name, phone, email, id_type, id_number, nationality, registered_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [guest_full_name, guest_phone, guest_email || null, guest_id_type || 'passport', guest_id_number || null, guest_nationality || null, user.id]
    );
    const guest_id = guestResult.rows[0].id;

    const bookingResult = await client.query(
      `INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_amount, amount_paid, status, payment_method, notes, nights, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, $9, $10) RETURNING id`,
      [guest_id, room_id, check_in_date, check_out_date, total_amount, total_amount, payment_method || 'cash', notes || null, nights, user.id]
    );
    const booking_id = bookingResult.rows[0].id;

    await client.query("UPDATE rooms SET status = 'reserved' WHERE id = $1", [room_id]);

    await client.query('COMMIT');
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    return { success: true, booking_id, total_amount, nights };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkIn(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      "SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = $1 AND b.status = 'confirmed'",
      [bookingId]
    );
    const bookings = bookingResult.rows;
    if (bookings.length === 0) throw new Error('Booking not found or already checked in');

    await client.query(
      "UPDATE bookings SET status = 'checked_in', actual_check_in = NOW() WHERE id = $1 AND status = 'confirmed'",
      [bookingId]
    );

    await client.query(
      "UPDATE rooms SET status = 'occupied' WHERE id = (SELECT room_id FROM bookings WHERE id = $1)",
      [bookingId]
    );

    await client.query('COMMIT');
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkOut(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      "SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = $1 AND b.status = 'checked_in'",
      [bookingId]
    );
    const bookings = bookingResult.rows;
    if (bookings.length === 0) throw new Error('Booking not found or already checked out');
    const booking = bookings[0];

    await client.query(
      "UPDATE bookings SET status = 'checked_out', actual_check_out = NOW() WHERE id = $1 AND status = 'checked_in'",
      [bookingId]
    );

    await client.query(
      "UPDATE rooms SET status = 'available' WHERE id = (SELECT room_id FROM bookings WHERE id = $1)",
      [bookingId]
    );

    const description = `Room ${booking.room_number} - Check-out ${new Date().toISOString().split('T')[0]}`;
    await client.query(
      "INSERT INTO financial_transactions (type, category, description, amount, reference_type, reference_id, payment_method, transaction_date, recorded_by) VALUES ('income', 'accommodation', $1, $2, 'booking', $3, 'cash', CURRENT_DATE, $4)",
      [description, Number(booking.total_amount), bookingId, user.id]
    );

    await client.query('COMMIT');
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);

    if (status === 'cancelled') {
      await client.query(
        "UPDATE rooms SET status = 'available' WHERE id = (SELECT room_id FROM bookings WHERE id = $1)",
        [bookingId]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRoomStatus(roomId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await pool.query('UPDATE rooms SET status = $1 WHERE id = $2', [status, roomId]);
  revalidatePath('/rooms');
  return { success: true };
}

export async function createRoom(data: {
  room_number: string;
  room_type_id: number;
  status: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { room_number, room_type_id, status } = data;

  if (!room_number) throw new Error('Room number is required');
  if (!room_type_id) throw new Error('Room type is required');

  const existing = await pool.query(
    'SELECT id FROM rooms WHERE room_number = $1',
    [room_number.toUpperCase()]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Room ${room_number.toUpperCase()} already exists`);
  }

  await pool.query(
    'INSERT INTO rooms (room_number, room_type_id, status) VALUES ($1, $2, $3)',
    [room_number.toUpperCase(), room_type_id, status || 'available']
  );

  revalidatePath('/rooms');
  return { success: true };
}

export async function updateRoom(data: {
  room_id: number;
  room_number: string;
  room_type_id: number;
  status: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { room_id, room_number, room_type_id, status } = data;

  if (!room_number) throw new Error('Room number is required');
  if (!room_type_id) throw new Error('Room type is required');

  await pool.query(
    'UPDATE rooms SET room_number = $1, room_type_id = $2, status = $3 WHERE id = $4',
    [room_number.toUpperCase(), room_type_id, status, room_id]
  );

  revalidatePath('/rooms');
  return { success: true };
}

export async function cancelBooking(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND status IN ('pending', 'confirmed')",
      [bookingId]
    );

    await client.query(
      "UPDATE rooms SET status = 'available' WHERE id = (SELECT room_id FROM bookings WHERE id = $1)",
      [bookingId]
    );

    await client.query('COMMIT');
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
