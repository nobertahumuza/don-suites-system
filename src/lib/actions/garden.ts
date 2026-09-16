'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getGardenBookings(filters?: { status?: string; date?: string }) {
  const where: Record<string, unknown> = {};

  if (filters?.status && ['confirmed', 'completed', 'cancelled'].includes(filters.status)) {
    where.status = filters.status;
  }
  if (filters?.date) {
    where.event_date = new Date(filters.date);
  }

  const bookings = await prisma.garden_bookings.findMany({
    where,
    include: { users: { select: { full_name: true } } },
    orderBy: [{ event_date: 'desc' }, { start_time: 'desc' }],
  });

  const mapped = bookings.map((b) => ({
    ...b,
    created_by_name: b.users?.full_name || null,
    total_amount: Number(b.total_amount ?? 0),
    amount_paid: Number(b.amount_paid ?? 0),
  }));

  const totalRevenue = mapped.reduce((sum, b) => sum + Number(b.amount_paid ?? 0), 0);

  return { bookings: mapped, totalBookings: mapped.length, totalRevenue };
}

export async function createGardenBookingAction(data: {
  guest_name: string;
  guest_phone: string;
  guest_id?: number;
  event_date: string;
  event_type: string;
  start_time: string;
  end_time: string;
  purpose: string;
  total_amount: number;
  amount_paid: number;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { guest_name, guest_phone, guest_id, event_date, event_type, start_time, end_time, purpose, total_amount, amount_paid, notes } = data;

  if (!guest_name) throw new Error('Guest name is required');
  if (!event_date) throw new Error('Event date is required');

  const result = await prisma.garden_bookings.create({
    data: {
      guest_id: guest_id || null,
      guest_name,
      guest_phone: guest_phone || null,
      event_date: new Date(event_date),
      event_type: event_type || null,
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

  revalidatePath('/garden-bookings');
  return { success: true, id: result.id };
}

export async function updateGardenBookingStatus(bookingId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  if (!['completed', 'cancelled'].includes(status)) throw new Error('Invalid status');

  await prisma.garden_bookings.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidatePath('/garden-bookings');
  return { success: true };
}
