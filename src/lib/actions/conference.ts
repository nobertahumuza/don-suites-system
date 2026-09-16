'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getConferenceBookings(filters?: { status?: string; date?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.status && ['confirmed', 'completed', 'cancelled'].includes(filters.status)) {
    where.status = filters.status;
  }
  if (filters?.date) {
    where.event_date = new Date(filters.date);
  }

  const bookings = await prisma.conference_bookings.findMany({
    where,
    include: { conference_halls: true },
    orderBy: [{ event_date: 'desc' }, { start_time: 'desc' }],
  });

  const mapped = bookings.map((b) => ({
    ...b,
    hall_name: b.conference_halls.name,
    hall_type: b.conference_halls.type,
    capacity: b.conference_halls.capacity,
    total_amount: Number(b.total_amount ?? 0),
    amount_paid: Number(b.amount_paid ?? 0),
    price_per_day: Number(b.conference_halls.price_per_day ?? 0),
    conference_halls: undefined,
  }));

  const totalRevenue = mapped.reduce((sum, b) => sum + Number(b.amount_paid ?? 0), 0);

  return { bookings: mapped, totalBookings: mapped.length, totalRevenue };
}

export async function getConferenceHalls() {
  return prisma.conference_halls.findMany({ orderBy: { name: 'asc' } });
}

export async function getGardenBookings() {
  const bookings = await prisma.garden_bookings.findMany({
    include: { users: { select: { full_name: true } } },
    orderBy: { event_date: 'desc' },
  });

  return bookings.map((b) => ({
    ...b,
    guest_name: b.guest_name || b.users?.full_name || null,
  }));
}

export async function updateConferenceBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['completed', 'cancelled'].includes(status)) throw new Error('Invalid status');

  const booking = await prisma.conference_bookings.findUnique({ where: { id: bookingId } });

  await prisma.$transaction([
    prisma.conference_bookings.update({
      where: { id: bookingId },
      data: { status },
    }),
    prisma.conference_halls.update({
      where: { id: booking?.hall_id! },
      data: { status: 'available' },
    }),
  ]);

  revalidatePath('/conference');
  return { success: true };
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

  const result = await prisma.$transaction([
    prisma.conference_bookings.create({
      data: {
        hall_id,
        guest_name,
        event_date: new Date(event_date),
        start_time: start_time ? new Date(`1970-01-01T${start_time}`) : null,
        end_time: end_time ? new Date(`1970-01-01T${end_time}`) : null,
        purpose: purpose || '',
        total_amount: total_amount || 0,
        amount_paid: amount_paid || 0,
        status: 'confirmed',
        notes: notes || null,
        created_by: user.id,
      },
    }),
    prisma.conference_halls.update({
      where: { id: hall_id },
      data: { status: 'booked' },
    }),
  ]);

  revalidatePath('/conference');
  return { success: true, id: (result[0] as { id: number }).id };
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

  const result = await prisma.garden_bookings.create({
    data: {
      guest_id: guest_id || null,
      guest_name,
      event_date: new Date(event_date),
      start_time: start_time ? new Date(`1970-01-01T${start_time}`) : null,
      end_time: end_time ? new Date(`1970-01-01T${end_time}`) : null,
      purpose: purpose || '',
      total_amount: total_amount || 0,
      amount_paid: amount_paid || 0,
      status: 'confirmed',
      notes: notes || null,
      created_by: user.id,
    },
  });

  revalidatePath('/conference');
  return { success: true, id: result.id };
}

export async function getConferenceHallsWithStats() {
  const halls = await prisma.conference_halls.findMany({
    include: { _count: { select: { conference_bookings: true } } },
    orderBy: { name: 'asc' },
  });

  return halls.map((h) => ({
    id: h.id,
    name: h.name,
    capacity: h.capacity,
    price_per_day: Number(h.price_per_day),
    type: h.type,
    status: h.status,
    description: h.description,
    booking_count: h._count.conference_bookings,
    created_at: h.created_at,
  }));
}

export async function createConferenceHall(data: {
  name: string;
  capacity: number;
  price_per_day: number;
  type: string;
  status: string;
  description: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { name, capacity, price_per_day, type, status, description } = data;
  if (!name) throw new Error('Name is required');
  if (!price_per_day || price_per_day <= 0) throw new Error('Price must be greater than 0');

  await prisma.conference_halls.create({
    data: {
      name,
      capacity: capacity || null,
      price_per_day,
      type: type || null,
      status: status || 'available',
      description: description || null,
    },
  });

  revalidatePath('/conference/halls');
  revalidatePath('/conference');
  return { success: true };
}

export async function updateConferenceHall(hallId: number, data: {
  name: string;
  capacity: number;
  price_per_day: number;
  type: string;
  status: string;
  description: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { name, capacity, price_per_day, type, status, description } = data;
  if (!name) throw new Error('Name is required');
  if (!price_per_day || price_per_day <= 0) throw new Error('Price must be greater than 0');

  await prisma.conference_halls.update({
    where: { id: hallId },
    data: {
      name,
      capacity: capacity || null,
      price_per_day,
      type: type || null,
      status: status || 'available',
      description: description || null,
    },
  });

  revalidatePath('/conference/halls');
  revalidatePath('/conference');
  return { success: true };
}

export async function deleteConferenceHall(hallId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const hall = await prisma.conference_halls.findUnique({
    where: { id: hallId },
    include: { _count: { select: { conference_bookings: true } } },
  });
  if (!hall) throw new Error('Hall not found');
  if (hall._count.conference_bookings > 0) throw new Error('Cannot delete hall with existing bookings');

  await prisma.conference_halls.delete({ where: { id: hallId } });
  revalidatePath('/conference/halls');
  revalidatePath('/conference');
  return { success: true };
}

export async function createConferenceBookingAction(data: {
  hall_id: number;
  guest_name: string;
  guest_phone: string;
  event_date: string;
  event_type: string;
  start_time: string;
  end_time: string;
  purpose: string;
  total_amount: number;
  amount_paid: number;
  notes: string;
}) {
  return createConferenceBooking({
    hall_id: data.hall_id,
    guest_name: data.guest_name,
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: data.end_time,
    purpose: data.purpose,
    total_amount: data.total_amount,
    amount_paid: data.amount_paid,
    notes: data.notes || undefined,
  });
}
