'use server';

import pool, { getClient } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface FbOrderItem {
  itemId: number;
  quantity: number;
}

export async function createOrder(data: {
  orderType: string;
  guestName: string;
  roomNumber?: string;
  bookingId?: number;
  guestId?: number;
  items: FbOrderItem[];
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { orderType, guestName, roomNumber, bookingId, guestId, items } = data;
  const SURCHARGE = 5000;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    let subtotal = 0;
    const validItems: { id: number; qty: number; price: number; name: string }[] = [];

    for (const item of items) {
      const rowsResult = await client.query(
        'SELECT id, name, price, stock_quantity FROM fb_items WHERE id = $1 AND status = $2',
        [item.itemId, 'active']
      );
      const row = rowsResult.rows[0] as any;
      if (!row) continue;

      const actualQty = Math.min(item.quantity, row.stock_quantity);
      if (actualQty <= 0) continue;

      const lineTotal = row.price * actualQty;
      subtotal += lineTotal;
      validItems.push({ id: row.id, qty: actualQty, price: row.price, name: row.name });
    }

    if (validItems.length === 0) {
      throw new Error('No valid items selected or all items out of stock');
    }

    const surcharge = orderType === 'room_service' ? SURCHARGE : 0;
    const total = subtotal + surcharge;

    const orderResult = await client.query(
      `INSERT INTO fb_orders (booking_id, guest_id, guest_name, room_number, order_type, room_service_surcharge, subtotal, total, payment_status, status, served_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unpaid', 'pending', $9, NOW()) RETURNING id`,
      [
        bookingId || null,
        guestId || null,
        guestName,
        roomNumber || '',
        orderType,
        surcharge,
        subtotal,
        total,
        user.id,
      ]
    );
    const orderId = orderResult.rows[0].id;

    for (const vi of validItems) {
      const updateResult = await client.query(
        'UPDATE fb_items SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1',
        [vi.qty, vi.id]
      );
      if ((updateResult as any).rowCount === 0) {
        throw new Error(`Insufficient stock for ${vi.name}`);
      }

      await client.query(
        'INSERT INTO fb_order_items (order_id, fb_item_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        [orderId, vi.id, vi.qty, vi.price, vi.price * vi.qty]
      );
    }

    await client.query(
      `INSERT INTO financial_transactions (type, category, description, amount, reference_type, reference_id, payment_method, transaction_date, recorded_by, created_at)
       VALUES ('income', 'food_beverage', $1, $2, 'fb_order', $3, 'cash', CURRENT_DATE, $4, NOW())`,
      [
        `F&B Order #${orderId} (${orderType.replace('_', ' ')})`,
        total,
        orderId,
        user.id,
      ]
    );

    await client.query('COMMIT');
    revalidatePath('/fb/orders');
    revalidatePath('/front-desk');

    return { success: true, orderId, total, message: `Order #${orderId} placed — UGX ${total.toLocaleString()}` };
  } catch (error: any) {
    await client.query('ROLLBACK');
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function markPaid(orderId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query(
    "UPDATE fb_orders SET payment_status = 'paid' WHERE id = $1 AND payment_status != 'paid'",
    [orderId]
  );

  revalidatePath('/fb/orders');
  revalidatePath('/front-desk');
  return { success: true };
}

export async function updateStatus(orderId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const allowed = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!allowed.includes(status)) throw new Error('Invalid status');

  await pool.query('UPDATE fb_orders SET status = $1 WHERE id = $2', [status, orderId]);

  revalidatePath('/fb/orders');
  revalidatePath('/front-desk');
  return { success: true };
}

export async function createItem(data: {
  name: string;
  categoryId: number;
  price: number;
  stockQuantity: number;
  image?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const result = await pool.query(
    'INSERT INTO fb_items (name, image, category_id, price, stock_quantity, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [data.name, data.image || null, data.categoryId, data.price, data.stockQuantity, 'active']
  );

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true, id: result.rows[0].id };
}

export async function updateItem(
  id: number,
  data: {
    name: string;
    categoryId: number;
    price: number;
    stockQuantity: number;
    status: string;
    image?: string;
  }
) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query(
    'UPDATE fb_items SET name=$1, image=$2, category_id=$3, price=$4, stock_quantity=$5, status=$6 WHERE id=$7',
    [data.name, data.image || null, data.categoryId, data.price, data.stockQuantity, data.status, id]
  );

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function deleteItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query('UPDATE fb_items SET status = $1 WHERE id = $2', ['inactive', id]);

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function activateItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query('UPDATE fb_items SET status = $1 WHERE id = $2', ['active', id]);

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function createCategory(data: {
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const result = await pool.query(
    'INSERT INTO fb_categories (name, description, sort_order) VALUES ($1, $2, $3) RETURNING id',
    [data.name, data.description || '', data.sortOrder || 0]
  );

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true, id: result.rows[0].id };
}

export async function updateCategory(
  id: number,
  data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }
) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query('UPDATE fb_categories SET name=$1, description=$2, sort_order=$3 WHERE id=$4', [
    data.name,
    data.description || '',
    data.sortOrder || 0,
    id,
  ]);

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function deleteCategory(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.query('UPDATE fb_items SET category_id = NULL WHERE category_id = $1', [id]);
  await pool.query('DELETE FROM fb_categories WHERE id = $1', [id]);

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function getFbOrders(filters?: {
  date?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  orderType?: string;
}) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.date) {
    conditions.push(`DATE(o.created_at) = $${params.length + 1}`);
    params.push(filters.date);
  }
  if (filters?.paymentStatus) {
    conditions.push(`o.payment_status = $${params.length + 1}`);
    params.push(filters.paymentStatus);
  }
  if (filters?.fulfillmentStatus) {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(filters.fulfillmentStatus);
  }
  if (filters?.orderType) {
    conditions.push(`o.order_type = $${params.length + 1}`);
    params.push(filters.orderType);
  }

  const where = conditions.join(' AND ');
  const result = await pool.query(
    `SELECT o.*, u.full_name as served_by_name
     FROM fb_orders o
     LEFT JOIN users u ON o.served_by = u.id
     WHERE ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  return result.rows as any[];
}

export async function getFbOrderItems(orderId: number) {
  const result = await pool.query(
    `SELECT oi.*, fi.name as item_name, fi.category, fi.image
     FROM fb_order_items oi
     LEFT JOIN fb_items fi ON oi.fb_item_id = fi.id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows as any[];
}

export async function getFbOrderById(orderId: number) {
  const result = await pool.query(
    `SELECT o.*, u.full_name as served_by_name
     FROM fb_orders o
     LEFT JOIN users u ON o.served_by = u.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
}

export async function getFbItems() {
  const result = await pool.query(
    `SELECT i.*, c.name as category_name
     FROM fb_items i
     LEFT JOIN fb_categories c ON i.category_id = c.id
     WHERE i.status = 'active' AND i.stock_quantity > 0
     ORDER BY c.sort_order, c.name, i.name`
  );
  return result.rows as any[];
}

export async function getAllFbItems(filters?: {
  category?: number;
  status?: string;
  search?: string;
}) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.category) {
    conditions.push(`i.category_id = $${params.length + 1}`);
    params.push(filters.category);
  }
  if (filters?.status) {
    conditions.push(`i.status = $${params.length + 1}`);
    params.push(filters.status);
  }
  if (filters?.search) {
    conditions.push(`i.name LIKE $${params.length + 1}`);
    params.push(`%${filters.search}%`);
  }

  const where = conditions.join(' AND ');
  const result = await pool.query(
    `SELECT i.*, c.name as category_name
     FROM fb_items i
     LEFT JOIN fb_categories c ON i.category_id = c.id
     WHERE ${where}
     ORDER BY c.sort_order, c.name, i.name`,
    params
  );
  return result.rows as any[];
}

export async function getFbCategories() {
  const result = await pool.query(
    `SELECT c.*, COUNT(i.id) as item_count
     FROM fb_categories c
     LEFT JOIN fb_items i ON i.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  return result.rows as any[];
}

export async function getFbStats() {
  const totalOrdersResult = await pool.query('SELECT COUNT(*) as c FROM fb_orders');
  const todayOrdersResult = await pool.query(
    'SELECT COUNT(*) as c FROM fb_orders WHERE DATE(created_at) = CURRENT_DATE'
  );
  const todayRevenueResult = await pool.query(
    'SELECT COALESCE(SUM(total),0) as c FROM fb_orders WHERE DATE(created_at) = CURRENT_DATE'
  );
  const unpaidCountResult = await pool.query(
    'SELECT COUNT(*) as c FROM fb_orders WHERE payment_status != $1',
    ['paid']
  );

  return {
    totalOrders: Number(totalOrdersResult.rows[0].c),
    todayOrders: Number(todayOrdersResult.rows[0].c),
    todayRevenue: Number(todayRevenueResult.rows[0].c),
    unpaidCount: Number(unpaidCountResult.rows[0].c),
  };
}

export async function getActiveBookings() {
  const result = await pool.query(
    `SELECT b.id, b.room_id, g.full_name, r.room_number
     FROM bookings b
     JOIN guests g ON b.guest_id = g.id
     JOIN rooms r ON b.room_id = r.id
     WHERE b.status IN ('confirmed','checked_in')
     ORDER BY r.room_number`
  );
  return result.rows as any[];
}
