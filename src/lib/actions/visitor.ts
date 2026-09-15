'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function logVisitor(data: {
  visitorName: string;
  visitorPhone?: string;
  visitorIdNumber?: string;
  purpose?: string;
  visitingGuest?: string;
  roomNumber?: string;
  vehicleNumber?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await prisma.visitor_log.create({
    data: {
      visitor_name: data.visitorName,
      visitor_phone: data.visitorPhone || '',
      visitor_id_number: data.visitorIdNumber || '',
      purpose: data.purpose || '',
      visiting_guest: data.visitingGuest || '',
      room_number: data.roomNumber || '',
      vehicle_number: data.vehicleNumber || '',
      time_in: new Date(),
      logged_by: user.id,
    },
    select: { id: true },
  });
  revalidatePath('/front-desk');
  return { success: true, id: result.id };
}

export async function checkOutVisitor(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await prisma.visitor_log.update({
    where: { id },
    data: { time_out: new Date() },
  });
  revalidatePath('/front-desk');
  return { success: true };
}

export async function getActiveVisitors() {
  return prisma.visitor_log.findMany({
    where: { time_out: null },
    include: { users: { select: { full_name: true } } },
    orderBy: { time_in: 'desc' },
  });
}

export async function getTodayVisitors() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return prisma.visitor_log.findMany({
    where: {
      time_in: { gte: today, lt: tomorrow },
    },
    orderBy: { time_in: 'desc' },
  });
}

export async function getRecentFbOrders(limit = 15) {
  return prisma.fb_orders.findMany({
    include: { users: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function getOrderItems(orderId: number) {
  return prisma.fb_order_items.findMany({
    where: { order_id: orderId },
    select: { fb_items: { select: { name: true } }, quantity: true },
  });
}

export async function getRoomStatus() {
  return prisma.rooms.findMany({
    include: { room_types: { select: { name: true } } },
    orderBy: { room_number: 'asc' },
  });
}

export async function getFrontDeskStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [activeVisitors, todayVisitors, todayOrders, todayRevenueAgg, pendingPayments, rooms] = await Promise.all([
    prisma.visitor_log.count({ where: { time_out: null } }),
    prisma.visitor_log.count({ where: { time_in: { gte: today, lt: tomorrow } } }),
    prisma.fb_orders.count({ where: { created_at: { gte: today, lt: tomorrow } } }),
    prisma.fb_orders.aggregate({
      _sum: { total: true },
      where: { payment_status: 'paid', created_at: { gte: today, lt: tomorrow } },
    }),
    prisma.fb_orders.count({ where: { payment_status: 'unpaid' } }),
    prisma.rooms.findMany({ select: { status: true } }),
  ]);
  const statusCounts = { available: 0, occupied: 0, reserved: 0, cleaning: 0 };
  for (const r of rooms) {
    if (r.status && r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++;
    }
  }
  return {
    activeVisitors,
    todayVisitors,
    todayOrders,
    todayRevenue: Number(todayRevenueAgg._sum.total ?? 0),
    pendingPayments,
    rooms: statusCounts,
  };
}
