'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getParkingStats() {
  const [parkedCount, todayCount, todayRevenue] = await Promise.all([
    prisma.vehicle_parking.count({ where: { status: 'parked' } }),
    prisma.vehicle_parking.count({
      where: {
        check_in: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.vehicle_parking.aggregate({
      _sum: { total_charge: true },
      where: {
        check_out: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        total_charge: { gt: 0 },
      },
    }),
  ]);

  return {
    parkedCount,
    todayCount,
    todayRevenue: Number(todayRevenue._sum.total_charge ?? 0),
  };
}

export async function getParkingRecords(filter: string = 'parked') {
  const orderBy =
    filter === 'departed'
      ? { check_out: 'desc' as const }
      : filter === 'parked'
        ? { check_in: 'desc' as const }
        : { created_at: 'desc' as const };

  const where =
    filter === 'parked'
      ? { status: 'parked' as const }
      : filter === 'departed'
        ? { status: 'departed' as const }
        : {};

  const take = filter === 'all' ? 50 : undefined;

  const results = await prisma.vehicle_parking.findMany({
    where,
    orderBy,
    take,
    include: { users: { select: { full_name: true } } },
  });

  return results.map((r) => ({
    ...r,
    guest_name: null,
  })) as any[];
}

export async function getGuests() {
  return prisma.guests.findMany({
    select: { id: true, full_name: true, phone: true },
    orderBy: { full_name: 'asc' },
  });
}

export async function checkInVehicle(data: {
  plate_number: string;
  vehicle_type: string;
  vehicle_make: string;
  color: string;
  owner_name: string;
  owner_phone: string;
  guest_id?: number;
  parking_spot: string;
  parking_rate: number;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { plate_number, vehicle_type, vehicle_make, color, owner_name, owner_phone, guest_id, parking_spot, parking_rate, notes } = data;

  if (!plate_number) throw new Error('Plate number is required');
  if (!owner_name) throw new Error('Owner name is required');
  if (!parking_spot) throw new Error('Parking spot is required');

  await prisma.vehicle_parking.create({
    data: {
      plate_number: plate_number.toUpperCase(),
      vehicle_type: vehicle_type || 'sedan',
      vehicle_make: vehicle_make || '',
      color: color || '',
      owner_name,
      owner_phone: owner_phone || '',
      guest_id: guest_id || null,
      parking_spot,
      check_in: new Date(),
      parking_rate: parking_rate || 5000,
      notes: notes || '',
      created_by: user.id,
    },
  });

  revalidatePath('/parking');
  return { success: true };
}

export async function checkOutVehicle(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const vehicle = await prisma.vehicle_parking.findFirst({
    where: { id, status: 'parked' },
  });
  if (!vehicle) throw new Error('Vehicle not found or already checked out');

  let charge = 0;
  if (vehicle.parking_rate && Number(vehicle.parking_rate) > 0) {
    const ci = new Date(vehicle.check_in!);
    const co = new Date();
    let hours = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60));
    if (hours < 1) hours = 1;
    charge = Number(vehicle.parking_rate) * hours;
  }

  await prisma.vehicle_parking.updateMany({
    where: { id, status: 'parked' },
    data: { status: 'departed', check_out: new Date(), total_charge: charge },
  });

  revalidatePath('/parking');
  return { success: true };
}

export async function deleteParkingRecord(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.vehicle_parking.delete({ where: { id } });
  revalidatePath('/parking');
  return { success: true };
}
