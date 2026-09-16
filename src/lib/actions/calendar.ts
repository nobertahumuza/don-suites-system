'use server';

import prisma from '@/lib/db';

export async function getBookingsForCalendar(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const rooms = await prisma.rooms.findMany({
    include: { room_types: true },
    orderBy: { room_number: 'asc' },
  });

  const bookings = await prisma.bookings.findMany({
    where: {
      OR: [
        {
          check_in_date: { lte: end },
          check_out_date: { gte: start },
          status: { in: ['confirmed', 'checked_in', 'pending'] },
        },
        {
          actual_check_in: { lte: end },
          actual_check_out: { gte: start },
          status: 'checked_in',
        },
      ],
    },
    include: {
      guests: true,
      rooms: true,
    },
    orderBy: { check_in_date: 'asc' },
  });

  return {
    rooms: rooms.map((r) => ({
      id: r.id,
      room_number: r.room_number,
      room_type: r.room_types?.name || 'N/A',
      status: r.status,
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      room_id: b.room_id,
      room_number: b.rooms?.room_number || '',
      guest_name: b.guests?.full_name || 'Unknown',
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      status: b.status,
      total_amount: Number(b.total_amount),
    })),
  };
}
