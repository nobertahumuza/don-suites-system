import { getInventoryItems, getInventoryStats, getInventoryCategories, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock } from '@/lib/actions/inventory';
import { revalidatePath } from 'next/cache';
import InventoryView from './inventory-view';

async function handleCreateItem(formData: FormData) {
  'use server';
  await createInventoryItem({
    name: formData.get('name') as string,
    categoryId: formData.get('category_id') ? Number(formData.get('category_id')) : undefined,
    quantityInStock: Number(formData.get('quantity_in_stock')),
    unit: formData.get('unit') as string || 'piece',
    reorderLevel: Number(formData.get('reorder_level') || 10),
  });
  revalidatePath('/inventory');
}

async function handleUpdateItem(formData: FormData) {
  'use server';
  await updateInventoryItem(Number(formData.get('item_id')), {
    name: formData.get('name') as string,
    categoryId: formData.get('category_id') ? Number(formData.get('category_id')) : undefined,
    quantityInStock: Number(formData.get('quantity_in_stock')),
    unit: formData.get('unit') as string || 'piece',
    reorderLevel: Number(formData.get('reorder_level') || 10),
    status: formData.get('status') as string,
  });
  revalidatePath('/inventory');
}

async function handleDeleteItem(formData: FormData) {
  'use server';
  await deleteInventoryItem(Number(formData.get('item_id')));
  revalidatePath('/inventory');
}

async function handleAdjustStock(formData: FormData) {
  'use server';
  await adjustStock(Number(formData.get('item_id')), {
    type: formData.get('adjustment_type') as string,
    quantity: Number(formData.get('quantity')),
    notes: formData.get('notes') as string || undefined,
  });
  revalidatePath('/inventory');
  revalidatePath('/inventory/stock-adjustments');
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const category = typeof params.category === 'string' ? Number(params.category) : undefined;
  const status = typeof params.status === 'string' ? params.status : '';

  let items: any[];
  let stats;
  let categories: any[];
  try {
    [items, stats, categories] = await Promise.all([
      getInventoryItems({
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
      }),
      getInventoryStats(),
      getInventoryCategories(),
    ]);
  } catch {
    items = [];
    stats = { totalItems: 0, lowStockCount: 0, categoriesCount: 0, totalStock: 0 };
    categories = [];
  }

  return (
    <InventoryView
      items={items}
      stats={stats}
      categories={categories}
      search={search}
      category={category}
      status={status}
      onHandleCreateItem={handleCreateItem}
      onHandleUpdateItem={handleUpdateItem}
      onHandleDeleteItem={handleDeleteItem}
      onHandleAdjustStock={handleAdjustStock}
    />
  );
}
