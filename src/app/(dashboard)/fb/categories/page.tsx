import { getFbCategories, createCategory, updateCategory, deleteCategory } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';
import FbCategoriesView from './fb-categories-view';

async function handleCreateCategory(formData: FormData) {
  'use server';
  await createCategory({
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    sortOrder: Number(formData.get('sort_order') || 0),
  });
  revalidatePath('/fb/categories');
}

async function handleUpdateCategory(formData: FormData) {
  'use server';
  await updateCategory(Number(formData.get('id')), {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    sortOrder: Number(formData.get('sort_order') || 0),
  });
  revalidatePath('/fb/categories');
}

async function handleDeleteCategory(formData: FormData) {
  'use server';
  await deleteCategory(Number(formData.get('id')));
  revalidatePath('/fb/categories');
}

export default async function FbCategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await getFbCategories();
  } catch {
    categories = [];
  }

  return (
    <FbCategoriesView
      categories={categories}
      onHandleCreateCategory={handleCreateCategory}
      onHandleUpdateCategory={handleUpdateCategory}
      onHandleDeleteCategory={handleDeleteCategory}
    />
  );
}
