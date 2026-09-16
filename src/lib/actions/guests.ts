'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getGuests(filters?: { search?: string; nationality?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: Record<string, unknown> = {};
  if (filters?.search) {
    const s = filters.search;
    where.OR = [
      { full_name: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
    ];
  }
  if (filters?.nationality) {
    where.nationality = { contains: filters.nationality, mode: 'insensitive' };
  }

  const guests = await prisma.guests.findMany({
    where,
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return guests.map((g) => ({
    id: g.id,
    full_name: g.full_name,
    phone: g.phone,
    email: g.email,
    sex: g.sex,
    age: g.age,
    id_type: g.id_type,
    id_number: g.id_number,
    nationality: g.nationality,
    vehicle_number: g.vehicle_number,
    created_at: g.created_at,
    booking_count: g._count.bookings,
  }));
}

export async function getGuestStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, male, female, newThisMonth] = await Promise.all([
    prisma.guests.count(),
    prisma.guests.count({ where: { sex: 'male' } }),
    prisma.guests.count({ where: { sex: 'female' } }),
    prisma.guests.count({ where: { created_at: { gte: startOfMonth } } }),
  ]);

  return { total, male, female, newThisMonth };
}

export async function createGuest(data: {
  full_name: string;
  phone: string;
  email: string;
  sex: string;
  age: number;
  id_type: string;
  id_number: string;
  nationality: string;
  vehicle_number: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { full_name, phone, email, sex, age, id_type, id_number, nationality, vehicle_number } = data;
  if (!full_name) throw new Error('Full name is required');

  await prisma.guests.create({
    data: {
      full_name,
      phone: phone || null,
      email: email || null,
      sex: sex || null,
      age: age || null,
      id_type: id_type || 'national_id',
      id_number: id_number || null,
      nationality: nationality || null,
      vehicle_number: vehicle_number || null,
      registered_by: user.id,
    },
  });

  revalidatePath('/guests');
  return { success: true };
}

export async function updateGuest(guestId: number, data: {
  full_name: string;
  phone: string;
  email: string;
  sex: string;
  age: number;
  id_type: string;
  id_number: string;
  nationality: string;
  vehicle_number: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { full_name, phone, email, sex, age, id_type, id_number, nationality, vehicle_number } = data;
  if (!full_name) throw new Error('Full name is required');

  await prisma.guests.update({
    where: { id: guestId },
    data: {
      full_name,
      phone: phone || null,
      email: email || null,
      sex: sex || null,
      age: age || null,
      id_type: id_type || 'national_id',
      id_number: id_number || null,
      nationality: nationality || null,
      vehicle_number: vehicle_number || null,
    },
  });

  revalidatePath('/guests');
  return { success: true };
}

export async function getGuestBookings(guestId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const bookings = await prisma.bookings.findMany({
    where: { guest_id: guestId },
    include: { rooms: true },
    orderBy: { created_at: 'desc' },
  });

  return bookings.map((b) => ({
    id: b.id,
    room_number: b.rooms?.room_number || 'N/A',
    check_in_date: b.check_in_date,
    check_out_date: b.check_out_date,
    total_amount: Number(b.total_amount),
    amount_paid: Number(b.amount_paid ?? 0),
    status: b.status,
    nights: b.nights,
    created_at: b.created_at,
  }));
}
