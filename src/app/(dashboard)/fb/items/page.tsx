import { getAllFbItems, getFbCategories, createItem, updateItem, deleteItem, activateItem } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';
import FbItemsView from './fb-items-view';

async function handleCreateItem(formData: FormData) {
  'use server';
  await createItem({
    name: formData.get('name') as string,
    categoryId: Number(formData.get('category_id')),
    price: Number(formData.get('price')),
    stockQuantity: Number(formData.get('stock_quantity')),
  });
  revalidatePath('/fb/items');
}

async function handleUpdateItem(formData: FormData) {
  'use server';
  await updateItem(Number(formData.get('item_id')), {
    name: formData.get('name') as string,
    categoryId: Number(formData.get('category_id')),
    price: Number(formData.get('price')),
    stockQuantity: Number(formData.get('stock_quantity')),
    status: formData.get('status') as string,
  });
  revalidatePath('/fb/items');
}

async function handleDeleteItem(formData: FormData) {
  'use server';
  await deleteItem(Number(formData.get('item_id')));
  revalidatePath('/fb/items');
}

async function handleActivateItem(formData: FormData) {
  'use server';
  await activateItem(Number(formData.get('item_id')));
  revalidatePath('/fb/items');
}

export default async function FbItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const category = typeof params.category === 'string' ? Number(params.category) : undefined;
  const status = typeof params.status === 'string' ? params.status : '';

  const [items, categories] = await Promise.all([
    getAllFbItems({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
    }),
    getFbCategories(),
  ]);

  return (
    <FbItemsView
      items={items}
      categories={categories}
      search={search}
      category={category}
      status={status}
      onHandleCreateItem={handleCreateItem}
      onHandleUpdateItem={handleUpdateItem}
      onHandleDeleteItem={handleDeleteItem}
      onHandleActivateItem={handleActivateItem}
    />
  );
}
