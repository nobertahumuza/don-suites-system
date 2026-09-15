'use server';

import prisma from '@/lib/db';
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

  try {
    const validItems: { id: number; qty: number; price: number; name: string }[] = [];
    let subtotal = 0;

    for (const item of items) {
      const row = await prisma.fb_items.findFirst({
        where: { id: item.itemId, status: 'active' },
        select: { id: true, name: true, price: true, stock_quantity: true },
      });
      if (!row) continue;

      const actualQty = Math.min(item.quantity, row.stock_quantity ?? 0);
      if (actualQty <= 0) continue;

      const lineTotal = Number(row.price) * actualQty;
      subtotal += lineTotal;
      validItems.push({ id: row.id, qty: actualQty, price: Number(row.price), name: row.name });
    }

    if (validItems.length === 0) {
      throw new Error('No valid items selected or all items out of stock');
    }

    const surcharge = orderType === 'room_service' ? SURCHARGE : 0;
    const total = subtotal + surcharge;

    const orderId = await prisma.$transaction(async (tx) => {
      const order = await tx.fb_orders.create({
        data: {
          booking_id: bookingId || null,
          guest_id: guestId || null,
          guest_name: guestName,
          room_number: roomNumber || '',
          order_type: orderType,
          room_service_surcharge: surcharge,
          subtotal,
          total,
          payment_status: 'unpaid',
          status: 'pending',
          served_by: user.id,
        },
        select: { id: true },
      });

      for (const vi of validItems) {
        const updateResult = await tx.fb_items.updateMany({
          where: { id: vi.id, stock_quantity: { gte: vi.qty } },
          data: { stock_quantity: { decrement: vi.qty } },
        });
        if (updateResult.count === 0) {
          throw new Error(`Insufficient stock for ${vi.name}`);
        }

        await tx.fb_order_items.create({
          data: {
            order_id: order.id,
            fb_item_id: vi.id,
            quantity: vi.qty,
            unit_price: vi.price,
            total_price: vi.price * vi.qty,
          },
        });
      }

      await tx.financial_transactions.create({
        data: {
          type: 'income',
          category: 'food_beverage',
          description: `F&B Order #${order.id} (${orderType.replace('_', ' ')})`,
          amount: total,
          reference_type: 'fb_order',
          reference_id: order.id,
          payment_method: 'cash',
          transaction_date: new Date(),
          recorded_by: user.id,
        },
      });

      return order.id;
    });

    revalidatePath('/fb/orders');
    revalidatePath('/front-desk');
    return { success: true, orderId, total, message: `Order #${orderId} placed — UGX ${total.toLocaleString()}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markPaid(orderId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.fb_orders.updateMany({
    where: { id: orderId, payment_status: { not: 'paid' } },
    data: { payment_status: 'paid' },
  });

  revalidatePath('/fb/orders');
  revalidatePath('/front-desk');
  return { success: true };
}

export async function updateStatus(orderId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const allowed = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!allowed.includes(status)) throw new Error('Invalid status');

  await prisma.fb_orders.updateMany({
    where: { id: orderId },
    data: { status },
  });

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

  const result = await prisma.fb_items.create({
    data: {
      name: data.name,
      image: data.image || null,
      category_id: data.categoryId,
      price: data.price,
      stock_quantity: data.stockQuantity,
      status: 'active',
    },
    select: { id: true },
  });

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true, id: result.id };
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

  await prisma.fb_items.updateMany({
    where: { id },
    data: {
      name: data.name,
      image: data.image || null,
      category_id: data.categoryId,
      price: data.price,
      stock_quantity: data.stockQuantity,
      status: data.status,
    },
  });

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function deleteItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.fb_items.updateMany({
    where: { id },
    data: { status: 'inactive' },
  });

  revalidatePath('/fb/items');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function activateItem(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.fb_items.updateMany({
    where: { id },
    data: { status: 'active' },
  });

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

  const result = await prisma.fb_categories.create({
    data: {
      name: data.name,
      description: data.description || '',
      sort_order: data.sortOrder || 0,
    },
    select: { id: true },
  });

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true, id: result.id };
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

  await prisma.fb_categories.updateMany({
    where: { id },
    data: {
      name: data.name,
      description: data.description || '',
      sort_order: data.sortOrder || 0,
    },
  });

  revalidatePath('/fb/categories');
  revalidatePath('/fb/orders/new');
  return { success: true };
}

export async function deleteCategory(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await prisma.fb_items.updateMany({
    where: { category_id: id },
    data: { category_id: null },
  });

  await prisma.fb_categories.deleteMany({
    where: { id },
  });

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
  const where: any = {};
  if (filters?.date) {
    const date = new Date(filters.date);
    const nextDate = new Date(filters.date);
    nextDate.setDate(nextDate.getDate() + 1);
    where.created_at = { gte: date, lt: nextDate };
  }
  if (filters?.paymentStatus) where.payment_status = filters.paymentStatus;
  if (filters?.fulfillmentStatus) where.status = filters.fulfillmentStatus;
  if (filters?.orderType) where.order_type = filters.orderType;

  const result = await prisma.fb_orders.findMany({
    where,
    include: {
      users: { select: { full_name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return result.map((o) => ({
    ...o,
    served_by_name: o.users?.full_name ?? null,
    users: undefined,
  }));
}

export async function getFbOrderItems(orderId: number) {
  const result = await prisma.fb_order_items.findMany({
    where: { order_id: orderId },
    include: {
      fb_items: { select: { name: true, category: true, image: true } },
    },
  });

  return result.map((oi) => ({
    ...oi,
    item_name: oi.fb_items?.name ?? null,
    category: oi.fb_items?.category ?? null,
    image: oi.fb_items?.image ?? null,
    fb_items: undefined,
  }));
}

export async function getFbOrderById(orderId: number) {
  const result = await prisma.fb_orders.findUnique({
    where: { id: orderId },
    include: {
      users: { select: { full_name: true } },
    },
  });

  if (!result) return null;

  return {
    ...result,
    served_by_name: result.users?.full_name ?? null,
    users: undefined,
  };
}

export async function getFbItems() {
  const result = await prisma.fb_items.findMany({
    where: { status: 'active', stock_quantity: { gt: 0 } },
    include: {
      fb_categories: { select: { name: true, sort_order: true } },
    },
    orderBy: [
      { fb_categories: { sort_order: 'asc' } },
      { fb_categories: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  return result.map((i) => ({
    ...i,
    category_name: i.fb_categories?.name ?? null,
    fb_categories: undefined,
  }));
}

export async function getAllFbItems(filters?: {
  category?: number;
  status?: string;
  search?: string;
}) {
  const where: any = {};
  if (filters?.category) where.category_id = filters.category;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) where.name = { contains: filters.search, mode: 'insensitive' };

  const result = await prisma.fb_items.findMany({
    where,
    include: {
      fb_categories: { select: { name: true, sort_order: true } },
    },
    orderBy: [
      { fb_categories: { sort_order: 'asc' } },
      { fb_categories: { name: 'asc' } },
      { name: 'asc' },
    ],
  });

  return result.map((i) => ({
    ...i,
    category_name: i.fb_categories?.name ?? null,
    fb_categories: undefined,
  }));
}

export async function getFbCategories() {
  const result = await prisma.fb_categories.findMany({
    include: {
      _count: { select: { fb_items: true } },
    },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  });

  return result.map((c) => ({
    ...c,
    item_count: c._count.fb_items,
    _count: undefined,
  }));
}

export async function getFbStats() {
  const [totalOrdersResult, todayOrdersResult, todayRevenueResult, unpaidCountResult] =
    await Promise.all([
      prisma.fb_orders.count(),
      prisma.fb_orders.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.fb_orders.aggregate({
        _sum: { total: true },
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.fb_orders.count({
        where: { payment_status: { not: 'paid' } },
      }),
    ]);

  return {
    totalOrders: totalOrdersResult,
    todayOrders: todayOrdersResult,
    todayRevenue: Number(todayRevenueResult._sum.total) || 0,
    unpaidCount: unpaidCountResult,
  };
}

export async function getActiveBookings() {
  const result = await prisma.bookings.findMany({
    where: { status: { in: ['confirmed', 'checked_in'] } },
    select: {
      id: true,
      room_id: true,
      guests: { select: { full_name: true } },
      rooms: { select: { room_number: true } },
    },
    orderBy: { rooms: { room_number: 'asc' } },
  });

  return result.map((b) => ({
    id: b.id,
    room_id: b.room_id,
    full_name: b.guests?.full_name ?? null,
    room_number: b.rooms?.room_number ?? null,
  }));
}
