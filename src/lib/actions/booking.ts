'use server';

import prisma from '@/lib/db';
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

  const room = await prisma.rooms.findFirst({
    where: { id: room_id, status: 'available' },
    include: { room_types: true },
  });
  if (!room) throw new Error('Selected room is not available');

  const ci = new Date(check_in_date);
  const co = new Date(check_out_date);
  const nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
  const total_amount = amount > 0 ? amount : nights * Number(room.room_types.price);

  const result = await prisma.$transaction(async (tx) => {
    const guest = await tx.guests.create({
      data: {
        full_name: guest_full_name,
        phone: guest_phone,
        email: guest_email || null,
        id_type: guest_id_type || 'passport',
        id_number: guest_id_number || null,
        nationality: guest_nationality || null,
        registered_by: user.id,
      },
    });

    const booking = await tx.bookings.create({
      data: {
        guest_id: guest.id,
        room_id,
        check_in_date: new Date(check_in_date),
        check_out_date: new Date(check_out_date),
        total_amount,
        amount_paid: total_amount,
        status: 'confirmed',
        payment_method: payment_method || 'cash',
        notes: notes || null,
        nights,
        created_by: user.id,
      },
    });

    await tx.rooms.update({
      where: { id: room_id },
      data: { status: 'reserved' },
    });

    return { booking_id: booking.id, total_amount, nights };
  });

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  return { success: true, ...result };
}

export async function checkIn(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'confirmed' },
  });
  if (!booking) throw new Error('Booking not found or already checked in');

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'checked_in', actual_check_in: new Date() },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'occupied' },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function checkOut(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findFirst({
    where: { id: bookingId, status: 'checked_in' },
    include: { rooms: true },
  });
  if (!booking) throw new Error('Booking not found or already checked out');

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'checked_out', actual_check_out: new Date() },
    }),
    prisma.rooms.update({
      where: { id: booking.room_id! },
      data: { status: 'available' },
    }),
    prisma.financial_transactions.create({
      data: {
        type: 'income',
        category: 'accommodation',
        description: `Room ${booking.rooms?.room_number} - Check-out ${new Date().toISOString().split('T')[0]}`,
        amount: Number(booking.total_amount),
        reference_type: 'booking',
        reference_id: bookingId,
        payment_method: 'cash',
        transaction_date: new Date(),
        recorded_by: user.id,
      },
    }),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function updateBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });

  await prisma.bookings.update({
    where: { id: bookingId },
    data: { status },
  });

  if (status === 'cancelled' && booking?.room_id) {
    await prisma.rooms.update({
      where: { id: booking.room_id },
      data: { status: 'available' },
    });
  }

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/bookings/checkin');
  revalidatePath('/bookings/checkout');
  return { success: true };
}

export async function updateRoomStatus(roomId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await prisma.rooms.update({
    where: { id: roomId },
    data: { status },
  });
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

  const existing = await prisma.rooms.findUnique({
    where: { room_number: room_number.toUpperCase() },
  });
  if (existing) {
    throw new Error(`Room ${room_number.toUpperCase()} already exists`);
  }

  await prisma.rooms.create({
    data: {
      room_number: room_number.toUpperCase(),
      room_type_id,
      status: status || 'available',
    },
  });

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

  await prisma.rooms.update({
    where: { id: room_id },
    data: {
      room_number: room_number.toUpperCase(),
      room_type_id,
      status,
    },
  });

  revalidatePath('/rooms');
  return { success: true };
}

export async function cancelBooking(bookingId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });

  await prisma.$transaction([
    prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    }),
    ...(booking?.room_id
      ? [
          prisma.rooms.update({
            where: { id: booking.room_id },
            data: { status: 'available' },
          }),
        ]
      : []),
  ]);

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  return { success: true };
}
