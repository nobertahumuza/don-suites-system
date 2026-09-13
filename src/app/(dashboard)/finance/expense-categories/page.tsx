'use client';

import { useState, useEffect } from 'react';
import { getAllExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '@/lib/actions/finance';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editModal, setEditModal] = useState<Record<string, unknown> | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active' });

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await getAllExpenseCategories();
      setCategories(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createExpenseCategory(form);
      setForm({ name: '', description: '' });
      loadCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    try {
      await updateExpenseCategory(editModal.id as number, editForm);
      setEditModal(null);
      loadCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteExpenseCategory(id);
      loadCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#0f1a3c' }}>
        <i className="fas fa-folder-open" style={{ color: '#c9a96e' }}></i> Expense Categories
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Category
              </h3>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maintenance" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Optional description" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> Add Category
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Category</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Description</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Usage</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">This Month</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
                  ) : categories.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">No categories found</td></tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-xs">{c.name as string}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{(c.description as string) || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">{c.usage_count as number} txns</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(Number(c.month_total) || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditModal(c); setEditForm({ name: c.name as string, description: (c.description as string) || '', status: (c.status as string) || 'active' }); }} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDelete(c.id as number)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-edit" style={{ color: '#c9a96e' }}></i> Edit Category
              </h2>
              <button onClick={() => setEditModal(null)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                  <i className="fas fa-save mr-1"></i> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
