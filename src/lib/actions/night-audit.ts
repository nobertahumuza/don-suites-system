'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function runNightAudit() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueBookings = await prisma.bookings.findMany({
    where: {
      status: 'checked_in',
      check_out_date: { lt: today },
    },
    include: { rooms: true },
  });

  const checkedOutRooms: { id: number; room_number: string; booking_id: number }[] = [];

  for (const booking of overdueBookings) {
    await prisma.$transaction([
      prisma.bookings.update({
        where: { id: booking.id },
        data: { status: 'checked_out', actual_check_out: new Date() },
      }),
      prisma.rooms.update({
        where: { id: booking.room_id! },
        data: { status: 'cleaning' },
      }),
    ]);

    checkedOutRooms.push({
      id: booking.room_id!,
      room_number: booking.rooms?.room_number ?? '',
      booking_id: booking.id,
    });
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalRevenue = await prisma.bookings.aggregate({
    where: {
      actual_check_out: { gte: today, lt: tomorrow },
    },
    _sum: { total_amount: true },
  });

  const occupiedRooms = await prisma.rooms.count({
    where: { status: 'occupied' },
  });

  const totalRooms = await prisma.rooms.count();

  const todayCheckIns = await prisma.bookings.count({
    where: {
      actual_check_in: { gte: today, lt: tomorrow },
    },
  });

  const todayCheckOuts = overdueBookings.length;

  const stats = {
    roomsCheckedOut: todayCheckOuts,
    roomsSetToCleaning: todayCheckOuts,
    revenue: Number(totalRevenue._sum.total_amount ?? 0),
    occupiedRooms,
    totalRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    todayCheckIns,
    todayCheckOuts,
    checkedOutRooms,
  };

  await prisma.activity_log.create({
    data: {
      action: 'night_audit',
      entity_type: 'system',
      entity_id: null,
      user_id: user.id,
      details: JSON.stringify(stats),
    },
  });

  revalidatePath('/rooms');
  revalidatePath('/bookings');
  revalidatePath('/night-audit');

  return { success: true, stats };
}

export async function getNightAuditHistory() {
  const logs = await prisma.activity_log.findMany({
    where: { action: 'night_audit' },
    orderBy: { created_at: 'desc' },
    take: 30,
    include: { users: true },
  });

  return logs.map((log) => ({
    id: log.id,
    created_at: log.created_at,
    user_name: log.users?.full_name ?? 'System',
    details: log.details ? JSON.parse(log.details) : null,
  }));
}
