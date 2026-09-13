'use client';

import { useState, useRef } from 'react';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

type Category = { id: number; name: string; description?: string; sort_order: number; item_count: number };
type Item = { id: number; name: string; category_id: number; category_name?: string; price: number; stock_quantity: number; status: string; image?: string };

export default function FbItemsView({
  items,
  categories,
  search,
  category,
  status,
  onHandleCreateItem,
  onHandleUpdateItem,
  onHandleDeleteItem,
  onHandleActivateItem,
}: {
  items: Item[];
  categories: Category[];
  search: string;
  category: number | undefined;
  status: string;
  onHandleCreateItem: (formData: FormData) => Promise<void>;
  onHandleUpdateItem: (formData: FormData) => Promise<void>;
  onHandleDeleteItem: (formData: FormData) => Promise<void>;
  onHandleActivateItem: (formData: FormData) => Promise<void>;
}) {
  const addModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);

  const totalItems = items.length;
  const activeItems = items.filter((i) => i.status === 'active').length;
  const totalValue = items.reduce((sum, i) => sum + Number(i.price) * i.stock_quantity, 0);

  function openEditModal(item: Item) {
    setEditItem(item);
    editModalRef.current?.showModal();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-utensils" style={{ color: '#c9a96e' }}></i>
          F&B Menu Items
        </h1>
        <button
          onClick={() => addModalRef.current?.showModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white"
          style={{ background: '#0f1a3c' }}
        >
          <i className="fas fa-plus"></i> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-boxes text-sm mb-2 block" style={{ color: '#3b82f6' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{totalItems}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Items</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-check-circle text-sm mb-2 block" style={{ color: '#10b981' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{activeItems}</div>
          <div className="text-[10px] text-gray-400 uppercase">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-tag text-sm mb-2 block" style={{ color: '#f97316' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{formatCurrency(totalValue)}</div>
          <div className="text-[10px] text-gray-400 uppercase">Stock Value</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-layer-group text-sm mb-2 block" style={{ color: '#8b5cf6' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{categories.length}</div>
          <div className="text-[10px] text-gray-400 uppercase">Categories</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search</label>
            <input type="text" name="search" defaultValue={search} placeholder="Item name..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
            <select name="category" defaultValue={category || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
            <select name="status" defaultValue={status} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-search mr-1"></i> Filter
          </button>
          <a href="/fb/items" className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</a>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">#</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Image</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Item Name</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Category</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Price</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Stock</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Status</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No items found</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500">{item.id}</td>
                    <td className="px-4 py-3">
                      {item.image ? (
                        <img src={`/${item.image}`} alt="" className="w-11 h-11 rounded-lg object-cover border-2 border-gray-100" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <i className="fas fa-utensils"></i>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-xs text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">{item.category_name || 'Uncategorized'}</span>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-xs" style={{ color: '#c9a96e' }}>{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3">
                      {item.stock_quantity <= 5 ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">{item.stock_quantity} low</span>
                      ) : (
                        <span className="text-xs text-gray-600">{item.stock_quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {item.status === 'active' ? (
                          <form action={onHandleDeleteItem}>
                            <input type="hidden" name="item_id" value={item.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50" title="Deactivate">
                              <i className="fas fa-trash"></i>
                            </button>
                          </form>
                        ) : (
                          <form action={onHandleActivateItem}>
                            <input type="hidden" name="item_id" value={item.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-emerald-200 text-emerald-600 hover:bg-emerald-50" title="Activate">
                              <i className="fas fa-check"></i>
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={addModalRef} className="rounded-2xl p-0 w-full max-w-lg backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Menu Item
            </h2>
            <button onClick={() => addModalRef.current?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={onHandleCreateItem} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <input type="text" name="name" required placeholder="e.g. Nile Special" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <select name="category_id" required className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price (UGX) *</label>
                <input type="number" name="price" step="100" min="0" required placeholder="e.g. 5000" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Quantity *</label>
              <input type="number" name="stock_quantity" min="0" required placeholder="e.g. 50" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Add Item
            </button>
          </form>
        </div>
      </dialog>

      <dialog ref={editModalRef} className="rounded-2xl p-0 w-full max-w-lg backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-edit" style={{ color: '#c9a96e' }}></i> Edit Item
            </h2>
            <button onClick={() => editModalRef.current?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={onHandleUpdateItem} className="p-5 space-y-4">
            <input type="hidden" name="item_id" value={editItem?.id ?? ''} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <input type="text" name="name" required defaultValue={editItem?.name ?? ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <select name="category_id" required defaultValue={editItem?.category_id ?? ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Price (UGX) *</label>
                <input type="number" name="price" step="100" min="0" required defaultValue={editItem?.price ?? ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Quantity *</label>
                <input type="number" name="stock_quantity" min="0" required defaultValue={editItem?.stock_quantity ?? ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select name="status" defaultValue={editItem?.status ?? 'active'} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Update Item
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
