'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSeasonalPricing() {
  const results = await prisma.seasonal_pricing.findMany({
    orderBy: { start_date: 'desc' },
    include: { room_types: { select: { name: true } } },
  });

  return results.map((r) => ({
    ...r,
    room_type_name: r.room_types?.name ?? null,
  })) as any[];
}

export async function getRoomTypes() {
  return prisma.room_types.findMany({ orderBy: { name: 'asc' } });
}

export async function addSeasonalPricing(data: {
  room_type_id: number;
  season_name: string;
  start_date: string;
  end_date: string;
  price: number;
  cooking_space_price?: number;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { room_type_id, season_name, start_date, end_date, price, cooking_space_price } = data;

  if (!season_name) throw new Error('Season name is required');
  if (!start_date) throw new Error('Start date is required');
  if (!end_date) throw new Error('End date is required');
  if (!price || price <= 0) throw new Error('Price must be positive');
  if (!room_type_id) throw new Error('Room type is required');

  await prisma.seasonal_pricing.create({
    data: {
      room_type_id,
      season_name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      price,
      cooking_space_price: cooking_space_price ?? undefined,
    },
  });

  revalidatePath('/pricing/seasonal');
  return { success: true };
}

export async function deleteSeasonalPricing(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.seasonal_pricing.delete({ where: { id } });
  revalidatePath('/pricing/seasonal');
  return { success: true };
}

export async function getDiscounts(filters?: { status?: string }) {
  const where: any = {};
  if (filters?.status && ['active', 'inactive'].includes(filters.status)) {
    where.status = filters.status;
  }

  const [discounts, activeCount, expiredCount, totalUses] = await Promise.all([
    prisma.discounts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { users: { select: { full_name: true } } },
    }),
    prisma.discounts.count({ where: { status: 'active' } }),
    prisma.discounts.count({
      where: { valid_until: { lt: new Date() } },
    }),
    prisma.discounts.aggregate({ _sum: { used_count: true } }),
  ]);

  return {
    discounts: discounts.map((d) => ({
      ...d,
      created_by_name: d.users?.full_name ?? null,
    })) as any[],
    stats: {
      total: discounts.length,
      active: activeCount,
      expired: expiredCount,
      totalUses: Number(totalUses._sum.used_count ?? 0),
    },
  };
}

export async function createDiscount(data: {
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_amount: number;
  max_uses: number;
  applies_to: string;
  valid_from: string;
  valid_until: string;
  status: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { code, description, discount_type, discount_value, min_amount, max_uses, applies_to, valid_from, valid_until, status } = data;

  if (!code) throw new Error('Code is required');
  if (!discount_value || discount_value <= 0) throw new Error('Discount value must be positive');
  if (!valid_from || !valid_until) throw new Error('Validity period is required');
  if (valid_from > valid_until) throw new Error('Valid from must be before valid until');

  await prisma.discounts.create({
    data: {
      code: code.toUpperCase(),
      description: description || '',
      discount_type: discount_type || 'percentage',
      discount_value,
      min_amount: min_amount || 0,
      max_uses: max_uses || 0,
      applies_to: applies_to || 'all',
      valid_from: new Date(valid_from),
      valid_until: new Date(valid_until),
      status: status || 'active',
      created_by: user.id,
    },
  });

  revalidatePath('/pricing/discounts');
  return { success: true };
}

export async function deleteDiscount(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.discounts.delete({ where: { id } });
  revalidatePath('/pricing/discounts');
  return { success: true };
}
