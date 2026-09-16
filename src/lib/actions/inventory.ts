'use server';

import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getInventoryItems(filters?: {
  category?: number;
  search?: string;
  status?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: any = {};
  if (filters?.category) where.category_id = filters.category;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) where.name = { contains: filters.search, mode: 'insensitive' };

  const result = await prisma.inventory_items.findMany({
    where,
    include: {
      inventory_categories: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return result.map((i) => ({
    ...i,
    category_name: i.inventory_categories?.name ?? null,
    inventory_categories: undefined,
  }));
}

export async function getInventoryCategories() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const result = await prisma.inventory_categories.findMany({
    include: {
      _count: { select: { inventory_items: true } },
    },
    orderBy: { name: 'asc' },
  });

  return result.map((c) => ({
    ...c,
    item_count: c._count.inventory_items,
    _count: undefined,
  }));
}

export async function getInventoryStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const [totalItems, categoriesCount, stockSum, allItems] = await Promise.all([
    prisma.inventory_items.count({ where: { status: 'active' } }),
    prisma.inventory_categories.count(),
    prisma.inventory_items.aggregate({
      _sum: { quantity_in_stock: true },
      where: { status: 'active' },
    }),
    prisma.inventory_items.findMany({
      where: { status: 'active' },
      select: { quantity_in_stock: true, reorder_level: true },
    }),
  ]);

  const lowStockCount = allItems.filter(
    (i) => Number(i.quantity_in_stock) <= Number(i.reorder_level)
  ).length;

  return {
    totalItems,
    lowStockCount,
    categoriesCount,
    totalStock: Number(stockSum._sum.quantity_in_stock) || 0,
  };
}

export async function createInventoryItem(data: {
  name: string;
  categoryId?: number;
  quantityInStock: number;
  unit?: string;
  reorderLevel: number;
}) {
  const user = await requireRole(['admin', 'storekeeper']);

  const result = await prisma.inventory_items.create({
    data: {
      name: data.name,
      category_id: data.categoryId || null,
      quantity_in_stock: data.quantityInStock,
      unit: data.unit || 'piece',
      reorder_level: data.reorderLevel,
      status: 'active',
    },
    select: { id: true },
  });

  revalidatePath('/inventory');
  return { success: true, id: result.id };
}

export async function updateInventoryItem(
  id: number,
  data: {
    name: string;
    categoryId?: number;
    quantityInStock: number;
    unit?: string;
    reorderLevel: number;
    status: string;
  }
) {
  const user = await requireRole(['admin', 'storekeeper']);

  await prisma.inventory_items.updateMany({
    where: { id },
    data: {
      name: data.name,
      category_id: data.categoryId || null,
      quantity_in_stock: data.quantityInStock,
      unit: data.unit || 'piece',
      reorder_level: data.reorderLevel,
      status: data.status,
    },
  });

  revalidatePath('/inventory');
  return { success: true };
}

export async function deleteInventoryItem(id: number) {
  const user = await requireRole(['admin', 'storekeeper']);

  await prisma.inventory_items.updateMany({
    where: { id },
    data: { status: 'inactive' },
  });

  revalidatePath('/inventory');
  return { success: true };
}

export async function adjustStock(
  id: number,
  data: {
    type: string;
    quantity: number;
    notes?: string;
  }
) {
  const user = await requireRole(['admin', 'storekeeper']);

  const item = await prisma.inventory_items.findUnique({ where: { id } });
  if (!item) throw new Error('Item not found');

  let newQuantity = Number(item.quantity_in_stock);
  if (data.type === 'in') {
    newQuantity += data.quantity;
  } else if (data.type === 'out') {
    if (data.quantity > newQuantity) throw new Error('Insufficient stock');
    newQuantity -= data.quantity;
  } else {
    newQuantity = data.quantity;
  }

  await prisma.$transaction([
    prisma.inventory_items.updateMany({
      where: { id },
      data: { quantity_in_stock: newQuantity },
    }),
    prisma.stock_transactions.create({
      data: {
        item_id: id,
        type: data.type,
        quantity: data.quantity,
        notes: data.notes || null,
        recorded_by: user.id,
      },
    }),
  ]);

  revalidatePath('/inventory');
  revalidatePath('/inventory/stock-adjustments');
  return { success: true, newQuantity };
}

export async function getStockTransactions(itemId?: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: any = {};
  if (itemId) where.item_id = itemId;

  const result = await prisma.stock_transactions.findMany({
    where,
    include: {
      inventory_items: { select: { name: true } },
      users: { select: { full_name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return result.map((t) => ({
    ...t,
    item_name: t.inventory_items?.name ?? null,
    recorded_by_name: t.users?.full_name ?? null,
    inventory_items: undefined,
    users: undefined,
  }));
}

export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  const user = await requireRole(['admin', 'storekeeper']);

  const result = await prisma.inventory_categories.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
    select: { id: true },
  });

  revalidatePath('/inventory');
  revalidatePath('/inventory/categories');
  return { success: true, id: result.id };
}

export async function updateCategory(
  id: number,
  data: {
    name: string;
    description?: string;
  }
) {
  const user = await requireRole(['admin', 'storekeeper']);

  await prisma.inventory_categories.updateMany({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/inventory/categories');
  return { success: true };
}

export async function deleteCategory(id: number) {
  const user = await requireRole(['admin', 'storekeeper']);

  await prisma.inventory_items.updateMany({
    where: { category_id: id },
    data: { category_id: null },
  });

  await prisma.inventory_categories.deleteMany({
    where: { id },
  });

  revalidatePath('/inventory');
  revalidatePath('/inventory/categories');
  return { success: true };
}
