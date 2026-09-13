'use server';

import pool from '@/lib/db';
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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const validItems: { id: number; qty: number; price: number; name: string }[] = [];

    for (const item of items) {
      const [rows] = await conn.execute(
        'SELECT id, name, price, stock_quantity FROM fb_items WHERE id = ? AND status = ?',
        [item.itemId, 'active']
      );
      const row = (rows as any[])[0];
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

    const [orderResult] = await conn.execute(
      `INSERT INTO fb_orders (booking_id, guest_id, guest_name, room_number, order_type, room_service_surcharge, subtotal, total, payment_status, status, served_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, NOW())`,
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
    const orderId = (orderResult as any).insertId;

    for (const vi of validItems) {
      const [updateResult] = await conn.execute(
        'UPDATE fb_items SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
        [vi.qty, vi.id, vi.qty]
      );
      if ((updateResult as any).affectedRows === 0) {
        throw new Error(`Insufficient stock for ${vi.name}`);
      }

      await conn.execute(
        'INSERT INTO fb_order_items (order_id, fb_item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [orderId, vi.id, vi.qty, vi.price, vi.price * vi.qty]
      );
    }

    await conn.execute(
      `INSERT INTO financial_transactions (type, category, description, amount, reference_type, reference_id, payment_method, transaction_date, recorded_by, created_at)
       VALUES ('income', 'food_beverage', ?, ?, 'fb_order', ?, 'cash', CURDATE(), ?, NOW())`,
      [
        `F&B Order #${orderId} (${orderType.replace('_', ' ')})`,
        total,
        orderId,
        user.id,
      ]
    );

    await conn.commit();
    revalidatePath('/fb/orders');
    revalidatePath('/front-desk');

    return { success: true, orderId, total, message: `Order #${orderId} placed — UGX ${total.toLocaleString()}` };
  } catch (error: any) {
    await conn.rollback();
    return { success: false, error: error.message };
  } finally {
    conn.release();
  }
}

export async function markPaid(orderId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute(
    "UPDATE fb_orders SET payment_status = 'paid' WHERE id = ? AND payment_status != 'paid'",
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

  await pool.execute('UPDATE fb_orders SET status = ? WHERE id = ?', [status, orderId]);

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

  const [result] = await pool.execute(
    'INSERT INTO fb_items (name, image, category_id, price, stock_quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, data.image || null, data.categoryId, data.price, data.stockQuantity, 'active']
  );

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true, id: (result as any).insertId };
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

  await pool.execute(
    'UPDATE fb_items SET name=?, image=?, category_id=?, price=?, stock_quantity=?, status=? WHERE id=?',
    [data.name, data.image || null, data.categoryId, data.price, data.stockQuantity, data.status, id]
  );

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function deleteItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute('UPDATE fb_items SET status = ? WHERE id = ?', ['inactive', id]);

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function activateItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute('UPDATE fb_items SET status = ? WHERE id = ?', ['active', id]);

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

  const [result] = await pool.execute(
    'INSERT INTO fb_categories (name, description, sort_order) VALUES (?, ?, ?)',
    [data.name, data.description || '', data.sortOrder || 0]
  );

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true, id: (result as any).insertId };
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

  await pool.execute('UPDATE fb_categories SET name=?, description=?, sort_order=? WHERE id=?', [
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

  await pool.execute('UPDATE fb_items SET category_id = NULL WHERE category_id = ?', [id]);
  await pool.execute('DELETE FROM fb_categories WHERE id = ?', [id]);

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
    conditions.push('DATE(o.created_at) = ?');
    params.push(filters.date);
  }
  if (filters?.paymentStatus) {
    conditions.push('o.payment_status = ?');
    params.push(filters.paymentStatus);
  }
  if (filters?.fulfillmentStatus) {
    conditions.push('o.status = ?');
    params.push(filters.fulfillmentStatus);
  }
  if (filters?.orderType) {
    conditions.push('o.order_type = ?');
    params.push(filters.orderType);
  }

  const where = conditions.join(' AND ');
  const [rows] = await pool.execute(
    `SELECT o.*, u.full_name as served_by_name
     FROM fb_orders o
     LEFT JOIN users u ON o.served_by = u.id
     WHERE ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  return rows as any[];
}

export async function getFbOrderItems(orderId: number) {
  const [rows] = await pool.execute(
    `SELECT oi.*, fi.name as item_name, fi.category, fi.image
     FROM fb_order_items oi
     LEFT JOIN fb_items fi ON oi.fb_item_id = fi.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows as any[];
}

export async function getFbOrderById(orderId: number) {
  const [rows] = await pool.execute(
    `SELECT o.*, u.full_name as served_by_name
     FROM fb_orders o
     LEFT JOIN users u ON o.served_by = u.id
     WHERE o.id = ?`,
    [orderId]
  );
  return (rows as any[])[0] || null;
}

export async function getFbItems() {
  const [rows] = await pool.execute(
    `SELECT i.*, c.name as category_name
     FROM fb_items i
     LEFT JOIN fb_categories c ON i.category_id = c.id
     WHERE i.status = 'active' AND i.stock_quantity > 0
     ORDER BY c.sort_order, c.name, i.name`
  );
  return rows as any[];
}

export async function getAllFbItems(filters?: {
  category?: number;
  status?: string;
  search?: string;
}) {
  const conditions = ['1=1'];
  const params: any[] = [];

  if (filters?.category) {
    conditions.push('i.category_id = ?');
    params.push(filters.category);
  }
  if (filters?.status) {
    conditions.push('i.status = ?');
    params.push(filters.status);
  }
  if (filters?.search) {
    conditions.push('i.name LIKE ?');
    params.push(`%${filters.search}%`);
  }

  const where = conditions.join(' AND ');
  const [rows] = await pool.execute(
    `SELECT i.*, c.name as category_name
     FROM fb_items i
     LEFT JOIN fb_categories c ON i.category_id = c.id
     WHERE ${where}
     ORDER BY c.sort_order, c.name, i.name`,
    params
  );
  return rows as any[];
}

export async function getFbCategories() {
  const [rows] = await pool.execute(
    `SELECT c.*, COUNT(i.id) as item_count
     FROM fb_categories c
     LEFT JOIN fb_items i ON i.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  return rows as any[];
}

export async function getFbStats() {
  const [totalOrders] = await pool.execute('SELECT COUNT(*) as c FROM fb_orders');
  const [todayOrders] = await pool.execute(
    'SELECT COUNT(*) as c FROM fb_orders WHERE DATE(created_at) = CURDATE()'
  );
  const [todayRevenue] = await pool.execute(
    'SELECT COALESCE(SUM(total),0) as c FROM fb_orders WHERE DATE(created_at) = CURDATE()'
  );
  const [unpaidCount] = await pool.execute(
    'SELECT COUNT(*) as c FROM fb_orders WHERE payment_status != ?',
    ['paid']
  );

  return {
    totalOrders: (totalOrders as any[])[0].c,
    todayOrders: (todayOrders as any[])[0].c,
    todayRevenue: (todayRevenue as any[])[0].c,
    unpaidCount: (unpaidCount as any[])[0].c,
  };
}

export async function getActiveBookings() {
  const [rows] = await pool.execute(
    `SELECT b.id, b.room_id, g.full_name, r.room_number
     FROM bookings b
     JOIN guests g ON b.guest_id = g.id
     JOIN rooms r ON b.room_id = r.id
     WHERE b.status IN ('confirmed','checked_in')
     ORDER BY r.room_number`
  );
  return rows as any[];
}
