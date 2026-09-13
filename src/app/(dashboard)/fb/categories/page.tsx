import { getFbCategories, createCategory, updateCategory, deleteCategory } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';

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
  const categories = await getFbCategories();

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-utensils" style={{ color: '#c9a96e' }}></i>
          F&B Categories
        </h1>
        <button
          onClick={() => (document.getElementById('addModal') as HTMLDialogElement)?.showModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white"
          style={{ background: '#0f1a3c' }}
        >
          <i className="fas fa-plus"></i> Add Category
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-layer-group text-sm mb-2 block" style={{ color: '#3b82f6' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{categories.length}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Categories</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-check-circle text-sm mb-2 block" style={{ color: '#10b981' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{categories.length}</div>
          <div className="text-[10px] text-gray-400 uppercase">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-box text-sm mb-2 block" style={{ color: '#f97316' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{categories.reduce((sum, c) => sum + c.item_count, 0)}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Items</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">#</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Category Name</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Description</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Items</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Sort</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No categories found</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500">{cat.id}</td>
                    <td className="px-4 py-3 font-bold text-xs text-gray-800">{cat.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{cat.description || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold">{cat.item_count} items</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const modal = document.getElementById('editModal') as HTMLDialogElement;
                            if (modal) {
                              (modal.querySelector('[name="id"]') as HTMLInputElement).value = String(cat.id);
                              (modal.querySelector('[name="name"]') as HTMLInputElement).value = cat.name;
                              (modal.querySelector('[name="description"]') as HTMLTextAreaElement).value = cat.description || '';
                              (modal.querySelector('[name="sort_order"]') as HTMLInputElement).value = String(cat.sort_order);
                              modal.showModal();
                            }
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <form action={handleDeleteCategory}>
                          <input type="hidden" name="id" value={cat.id} />
                          <button
                            type="submit"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete"
                            onClick={(e) => {
                              if (!confirm('Delete this category? Items will be unassigned.')) e.preventDefault();
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog id="addModal" className="rounded-2xl p-0 w-full max-w-md backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Category
            </h2>
            <button onClick={() => (document.getElementById('addModal') as HTMLDialogElement)?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={handleCreateCategory} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name *</label>
              <input type="text" name="name" required placeholder="e.g. Cocktails" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea name="description" rows={2} placeholder="Brief description" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
              <input type="number" name="sort_order" defaultValue={0} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Save Category
            </button>
          </form>
        </div>
      </dialog>

      <dialog id="editModal" className="rounded-2xl p-0 w-full max-w-md backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-edit" style={{ color: '#c9a96e' }}></i> Edit Category
            </h2>
            <button onClick={() => (document.getElementById('editModal') as HTMLDialogElement)?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={handleUpdateCategory} className="p-5 space-y-4">
            <input type="hidden" name="id" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name *</label>
              <input type="text" name="name" required className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
              <input type="number" name="sort_order" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Update Category
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
