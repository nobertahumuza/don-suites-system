import { getInventoryCategories, createCategory, updateCategory, deleteCategory } from '@/lib/actions/inventory';
import { revalidatePath } from 'next/cache';
import CategoriesView from './categories-view';

async function handleCreateCategory(formData: FormData) {
  'use server';
  await createCategory({
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  });
  revalidatePath('/inventory/categories');
}

async function handleUpdateCategory(formData: FormData) {
  'use server';
  await updateCategory(Number(formData.get('id')), {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  });
  revalidatePath('/inventory/categories');
}

async function handleDeleteCategory(formData: FormData) {
  'use server';
  await deleteCategory(Number(formData.get('id')));
  revalidatePath('/inventory/categories');
}

export default async function CategoriesPage() {
  const categories = await getInventoryCategories();

  return (
    <CategoriesView
      categories={categories}
      onHandleCreateCategory={handleCreateCategory}
      onHandleUpdateCategory={handleUpdateCategory}
      onHandleDeleteCategory={handleDeleteCategory}
    />
  );
}
