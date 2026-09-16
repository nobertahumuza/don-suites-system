'use client';

import { useState, useRef } from 'react';

type Item = {
  id: number;
  name: string;
  category_id: number | null;
  category_name?: string | null;
  quantity_in_stock: number | { toNumber: () => number } | null;
  unit: string | null;
  reorder_level: number | { toNumber: () => number } | null;
  status: string | null;
  created_at?: unknown;
};

type Category = {
  id: number;
  name: string;
  description?: string | null;
  item_count: number;
  created_at?: unknown;
};

type Stats = {
  totalItems: number;
  lowStockCount: number;
  categoriesCount: number;
  totalStock: number;
};

export default function InventoryView({
  items,
  stats,
  categories,
  search,
  category,
  status,
  onHandleCreateItem,
  onHandleUpdateItem,
  onHandleDeleteItem,
  onHandleAdjustStock,
}: {
  items: Item[];
  stats: Stats;
  categories: Category[];
  search: string;
  category: number | undefined;
  status: string;
  onHandleCreateItem: (formData: FormData) => Promise<void>;
  onHandleUpdateItem: (formData: FormData) => Promise<void>;
  onHandleDeleteItem: (formData: FormData) => Promise<void>;
  onHandleAdjustStock: (formData: FormData) => Promise<void>;
}) {
  const addModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const adjustModalRef = useRef<HTMLDialogElement>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [adjustItem, setAdjustItem] = useState<Item | null>(null);

  function openEditModal(item: Item) {
    setEditItem(item);
    editModalRef.current?.showModal();
  }

  function openAdjustModal(item: Item) {
    setAdjustItem(item);
    adjustModalRef.current?.showModal();
  }

  function handleDelete(e: React.FormEvent, id: number) {
    if (!confirm('Deactivate this item?')) {
      e.preventDefault();
    }
  }

  function getStockLevel(item: Item) {
    const stock = Number(item.quantity_in_stock ?? 0);
    const reorder = Number(item.reorder_level ?? 10);
    if (stock <= 0) return 'out';
    if (stock <= reorder) return 'low';
    return 'ok';
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-boxes" style={{ color: '#c9a96e' }}></i>
          Inventory Management
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
          <div className="text-lg font-extrabold text-gray-900">{stats.totalItems}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Items</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-exclamation-triangle text-sm mb-2 block" style={{ color: '#ef4444' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{stats.lowStockCount}</div>
          <div className="text-[10px] text-gray-400 uppercase">Low Stock</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-layer-group text-sm mb-2 block" style={{ color: '#8b5cf6' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{stats.categoriesCount}</div>
          <div className="text-[10px] text-gray-400 uppercase">Categories</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-cubes text-sm mb-2 block" style={{ color: '#10b981' }}></i>
          <div className="text-lg font-extrabold text-gray-900">{stats.totalStock}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Stock</div>
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
          <a href="/inventory" className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</a>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">#</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Name</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Category</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Stock</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Unit</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Reorder Level</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Status</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No items found</td></tr>
              ) : (
                items.map((item) => {
                  const level = getStockLevel(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">{item.id}</td>
                      <td className="px-4 py-3 font-bold text-xs text-gray-800">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">{item.category_name || 'Uncategorized'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {level === 'out' ? (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">0 (Out)</span>
                        ) : level === 'low' ? (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[11px] font-bold">{Number(item.quantity_in_stock ?? 0)} (Low)</span>
                        ) : (
                          <span className="text-xs text-gray-600 font-semibold">{Number(item.quantity_in_stock ?? 0)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.unit || 'piece'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{Number(item.reorder_level ?? 10)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            title="Adjust Stock"
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </button>
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
                              <button
                                type="submit"
                                className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"
                                title="Deactivate"
                                onClick={(e) => handleDelete(e, item.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={addModalRef} className="rounded-2xl p-0 w-full max-w-lg backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Inventory Item
            </h2>
            <button onClick={() => addModalRef.current?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={onHandleCreateItem} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <input type="text" name="name" required placeholder="e.g. Bed Sheets" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select name="category_id" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                <select name="unit" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="litre">Litre</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="roll">Roll</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity in Stock *</label>
                <input type="number" name="quantity_in_stock" min="0" required placeholder="e.g. 100" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reorder Level</label>
                <input type="number" name="reorder_level" min="0" defaultValue={10} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select name="category_id" defaultValue={editItem?.category_id ?? ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                <select name="unit" defaultValue={editItem?.unit ?? 'piece'} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="litre">Litre</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="roll">Roll</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity in Stock *</label>
                <input type="number" name="quantity_in_stock" min="0" required defaultValue={editItem ? Number(editItem.quantity_in_stock ?? 0) : ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reorder Level</label>
                <input type="number" name="reorder_level" min="0" defaultValue={editItem ? Number(editItem.reorder_level ?? 10) : 10} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select name="status" defaultValue={editItem?.status ?? 'active'} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Update Item
            </button>
          </form>
        </div>
      </dialog>

      <dialog ref={adjustModalRef} className="rounded-2xl p-0 w-full max-w-md backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-exchange-alt" style={{ color: '#c9a96e' }}></i> Adjust Stock
            </h2>
            <button onClick={() => adjustModalRef.current?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-400 uppercase mb-1">Item</div>
              <div className="text-sm font-bold text-gray-800">{adjustItem?.name}</div>
              <div className="text-xs text-gray-500 mt-1">Current Stock: <span className="font-bold">{Number(adjustItem?.quantity_in_stock ?? 0)}</span> {adjustItem?.unit || 'piece'}</div>
            </div>
          </div>
          <form action={onHandleAdjustStock} className="p-5 space-y-4">
            <input type="hidden" name="item_id" value={adjustItem?.id ?? ''} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction Type *</label>
              <select name="adjustment_type" required className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                <option value="in">Stock In (Receive)</option>
                <option value="out">Stock Out (Use/Sell)</option>
                <option value="adjust">Adjustment (Set Exact)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
              <input type="number" name="quantity" min="0" step="0.01" required placeholder="Enter quantity" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea name="notes" rows={2} placeholder="Optional notes..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"></textarea>
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-save mr-1"></i> Record Transaction
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}
