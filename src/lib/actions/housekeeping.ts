'use server';

import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getHousekeepingTasks(filters?: { status?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: Record<string, unknown> = {};

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  const rooms = await prisma.rooms.findMany({
    where,
    include: { room_types: true },
    orderBy: { room_number: 'asc' },
  });

  return rooms.map((room) => ({
    id: room.id,
    room_number: room.room_number,
    room_type: room.room_types.name,
    price: Number(room.room_types.price),
    status: room.status || 'available',
  }));
}

export async function getHousekeepingStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const [cleaning, available, occupied, reserved, outOfService] = await Promise.all([
    prisma.rooms.count({ where: { status: 'cleaning' } }),
    prisma.rooms.count({ where: { status: 'available' } }),
    prisma.rooms.count({ where: { status: 'occupied' } }),
    prisma.rooms.count({ where: { status: 'reserved' } }),
    prisma.rooms.count({ where: { status: 'out_of_service' } }),
  ]);

  return {
    pending: cleaning,
    available,
    occupied,
    reserved,
    out_of_service: outOfService,
    total: cleaning + available + occupied + reserved + outOfService,
  };
}

export async function assignHousekeeping(roomId: number, status: string) {
  const user = await requireRole(['admin', 'reception']);

  const validStatuses = ['cleaning', 'available', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await prisma.rooms.update({
    where: { id: roomId },
    data: { status },
  });

  revalidatePath('/housekeeping');
  revalidatePath('/rooms');
  return { success: true };
}

export async function completeHousekeeping(roomId: number) {
  const user = await requireRole(['admin', 'reception']);

  const room = await prisma.rooms.findUnique({ where: { id: roomId } });
  if (!room) throw new Error('Room not found');

  await prisma.rooms.update({
    where: { id: roomId },
    data: { status: 'available' },
  });

  revalidatePath('/housekeeping');
  revalidatePath('/rooms');
  return { success: true };
}

export async function bulkUpdateHousekeeping(roomIds: number[], status: string) {
  const user = await requireRole(['admin', 'reception']);

  const validStatuses = ['cleaning', 'available', 'out_of_service'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');

  await prisma.rooms.updateMany({
    where: { id: { in: roomIds } },
    data: { status },
  });

  revalidatePath('/housekeeping');
  revalidatePath('/rooms');
  return { success: true };
}
