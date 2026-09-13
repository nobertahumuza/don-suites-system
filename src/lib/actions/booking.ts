'use server';

import pool from '@/lib/db';
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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [roomRows] = await conn.execute(
      "SELECT r.*, rt.price, rt.name as type_name FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = ? AND r.status = 'available'",
      [room_id]
    );
    const rooms = roomRows as Array<Record<string, unknown>>;
    if (rooms.length === 0) throw new Error('Selected room is not available');
    const room = rooms[0];

    const ci = new Date(check_in_date);
    const co = new Date(check_out_date);
    const nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    const total_amount = amount > 0 ? amount : nights * (room.price as number);

    const [guestResult] = await conn.execute(
      'INSERT INTO guests (full_name, phone, email, id_type, id_number, nationality, registered_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [guest_full_name, guest_phone, guest_email || null, guest_id_type || 'passport', guest_id_number || null, guest_nationality || null, user.id]
    );
    const guest_id = (guestResult as { insertId: number }).insertId;

    const [bookingResult] = await conn.execute(
      `INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_amount, amount_paid, status, payment_method, notes, nights, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?)`,
      [guest_id, room_id, check_in_date, check_out_date, total_amount, total_amount, payment_method || 'cash', notes || null, nights, user.id]
    );
    const booking_id = (bookingResult as { insertId: number }).insertId;

    await conn.execute("UPDATE rooms SET status = 'reserved' WHERE id = ?", [room_id]);

    await conn.commit();
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    return { success: true, booking_id, total_amount, nights };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function checkIn(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [bookingRows] = await conn.execute(
      "SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ? AND b.status = 'confirmed'",
      [bookingId]
    );
    const bookings = bookingRows as Array<Record<string, unknown>>;
    if (bookings.length === 0) throw new Error('Booking not found or already checked in');

    await conn.execute(
      "UPDATE bookings SET status = 'checked_in', actual_check_in = NOW() WHERE id = ? AND status = 'confirmed'",
      [bookingId]
    );

    await conn.execute(
      "UPDATE rooms SET status = 'occupied' WHERE id = (SELECT room_id FROM bookings WHERE id = ?)",
      [bookingId]
    );

    await conn.commit();
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function checkOut(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [bookingRows] = await conn.execute(
      "SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ? AND b.status = 'checked_in'",
      [bookingId]
    );
    const bookings = bookingRows as Array<Record<string, unknown>>;
    if (bookings.length === 0) throw new Error('Booking not found or already checked out');
    const booking = bookings[0];

    await conn.execute(
      "UPDATE bookings SET status = 'checked_out', actual_check_out = NOW() WHERE id = ? AND status = 'checked_in'",
      [bookingId]
    );

    await conn.execute(
      "UPDATE rooms SET status = 'available' WHERE id = (SELECT room_id FROM bookings WHERE id = ?)",
      [bookingId]
    );

    const description = `Room ${booking.room_number} - Check-out ${new Date().toISOString().split('T')[0]}`;
    await conn.execute(
      "INSERT INTO financial_transactions (type, category, description, amount, reference_type, reference_id, payment_method, transaction_date, recorded_by) VALUES ('income', 'accommodation', ?, ?, 'booking', ?, 'cash', CURDATE(), ?)",
      [description, Number(booking.total_amount), bookingId, user.id] as (string | number)[]
    );

    await conn.commit();
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    if (status === 'cancelled') {
      await conn.execute(
        "UPDATE rooms r JOIN bookings b ON r.id = b.room_id SET r.status = 'available' WHERE b.id = ?",
        [bookingId]
      );
    }

    await conn.commit();
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    revalidatePath('/bookings/checkin');
    revalidatePath('/bookings/checkout');
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateRoomStatus(roomId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await pool.execute('UPDATE rooms SET status = ? WHERE id = ?', [status, roomId]);
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

  const [existing] = await pool.execute(
    'SELECT id FROM rooms WHERE room_number = ?',
    [room_number.toUpperCase()]
  );
  if ((existing as Array<unknown>).length > 0) {
    throw new Error(`Room ${room_number.toUpperCase()} already exists`);
  }

  await pool.execute(
    'INSERT INTO rooms (room_number, room_type_id, status) VALUES (?, ?, ?)',
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

  await pool.execute(
    'UPDATE rooms SET room_number = ?, room_type_id = ?, status = ? WHERE id = ?',
    [room_number.toUpperCase(), room_type_id, status, room_id]
  );

  revalidatePath('/rooms');
  return { success: true };
}

export async function cancelBooking(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'confirmed')",
      [bookingId]
    );

    await conn.execute(
      "UPDATE rooms r JOIN bookings b ON r.id = b.room_id SET r.status = 'available' WHERE b.id = ?",
      [bookingId]
    );

    await conn.commit();
    revalidatePath('/rooms');
    revalidatePath('/bookings');
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
