'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getSeasonalPricing() {
  const [rows] = await pool.execute(
    `SELECT sp.*, rt.name as room_type_name
     FROM seasonal_pricing sp
     LEFT JOIN room_types rt ON sp.room_type_id = rt.id
     ORDER BY sp.start_date DESC`
  );
  return rows as any[];
}

export async function getRoomTypes() {
  const [rows] = await pool.execute('SELECT * FROM room_types ORDER BY name');
  return rows as any[];
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

  if (cooking_space_price !== undefined && cooking_space_price !== null) {
    await pool.execute(
      'INSERT INTO seasonal_pricing (room_type_id, season_name, start_date, end_date, price, cooking_space_price) VALUES (?, ?, ?, ?, ?, ?)',
      [room_type_id, season_name, start_date, end_date, price, cooking_space_price]
    );
  } else {
    await pool.execute(
      'INSERT INTO seasonal_pricing (room_type_id, season_name, start_date, end_date, price) VALUES (?, ?, ?, ?, ?)',
      [room_type_id, season_name, start_date, end_date, price]
    );
  }

  revalidatePath('/pricing/seasonal');
  return { success: true };
}

export async function deleteSeasonalPricing(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute('DELETE FROM seasonal_pricing WHERE id = ?', [id]);
  revalidatePath('/pricing/seasonal');
  return { success: true };
}

export async function getDiscounts(filters?: { status?: string }) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.status && ['active', 'inactive'].includes(filters.status)) {
    conditions.push('d.status = ?');
    params.push(filters.status);
  }

  const where = conditions.join(' AND ');
  const [rows] = await pool.execute(
    `SELECT d.*, u.full_name as created_by_name
     FROM discounts d
     LEFT JOIN users u ON d.created_by = u.id
     WHERE ${where}
     ORDER BY d.created_at DESC`,
    params
  );

  const [activeCount] = await pool.execute("SELECT COUNT(*) as c FROM discounts WHERE status = 'active'");
  const [expiredCount] = await pool.execute("SELECT COUNT(*) as c FROM discounts WHERE valid_until < CURDATE()");
  const [totalUses] = await pool.execute("SELECT COALESCE(SUM(used_count),0) as c FROM discounts");

  return {
    discounts: rows as any[],
    stats: {
      total: (rows as any[]).length,
      active: (activeCount as any[])[0].c,
      expired: (expiredCount as any[])[0].c,
      totalUses: (totalUses as any[])[0].c,
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

  await pool.execute(
    `INSERT INTO discounts (code, description, discount_type, discount_value, min_amount, max_uses, applies_to, valid_from, valid_until, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code.toUpperCase(),
      description || '',
      discount_type || 'percentage',
      discount_value,
      min_amount || 0,
      max_uses || 0,
      applies_to || 'all',
      valid_from,
      valid_until,
      status || 'active',
      user.id,
    ]
  );

  revalidatePath('/pricing/discounts');
  return { success: true };
}

export async function deleteDiscount(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute('DELETE FROM discounts WHERE id = ?', [id]);
  revalidatePath('/pricing/discounts');
  return { success: true };
}
