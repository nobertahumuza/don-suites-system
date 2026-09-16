'use client';

import { useState, useRef } from 'react';

type Transaction = {
  id: number;
  item_id: number;
  item_name?: string | null;
  type: string;
  quantity: number | { toNumber: () => number };
  reference?: string | null;
  notes?: string | null;
  recorded_by_name?: string | null;
  created_at?: unknown;
};

type Item = {
  id: number;
  name: string;
  quantity_in_stock: number | { toNumber: () => number } | null;
  unit: string | null;
  status: string | null;
};

function formatTransactionType(type: string) {
  if (type === 'in') return { label: 'Stock In', color: 'bg-emerald-100 text-emerald-700' };
  if (type === 'out') return { label: 'Stock Out', color: 'bg-red-100 text-red-700' };
  return { label: 'Adjustment', color: 'bg-amber-100 text-amber-700' };
}

function formatDate(d: unknown) {
  if (!d) return '-';
  const date = new Date(d as string);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdjustmentsView({
  transactions,
  items,
  selectedItemId,
  onHandleAdjustStock,
}: {
  transactions: Transaction[];
  items: Item[];
  selectedItemId?: number;
  onHandleAdjustStock: (formData: FormData) => Promise<void>;
}) {
  const adjustModalRef = useRef<HTMLDialogElement>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  function openAdjustModal(item?: Item) {
    setSelectedItem(item || null);
    adjustModalRef.current?.showModal();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-exchange-alt" style={{ color: '#c9a96e' }}></i>
          Stock Adjustments
        </h1>
        <button
          onClick={() => openAdjustModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white"
          style={{ background: '#0f1a3c' }}
        >
          <i className="fas fa-plus"></i> Adjust Stock
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Filter by Item</label>
            <select name="item" defaultValue={selectedItemId || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-search mr-1"></i> Filter
          </button>
          <a href="/inventory/stock-adjustments" className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</a>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">#</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Date</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Item</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Type</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Quantity</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Notes</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No transactions found</td></tr>
              ) : (
                transactions.map((tx) => {
                  const tt = formatTransactionType(tx.type);
                  return (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">{tx.id}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(tx.created_at)}</td>
                      <td className="px-4 py-3 font-bold text-xs text-gray-800">{tx.item_name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${tt.color}`}>{tt.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${tx.type === 'out' ? 'text-red-600' : tx.type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {tx.type === 'out' ? '-' : tx.type === 'in' ? '+' : '~'}{Number(tx.quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{tx.notes || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{tx.recorded_by_name || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={adjustModalRef} className="rounded-2xl p-0 w-full max-w-md backdrop:bg-black/50">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-bold flex items-center gap-2">
              <i className="fas fa-exchange-alt" style={{ color: '#c9a96e' }}></i> Adjust Stock
            </h2>
            <button onClick={() => adjustModalRef.current?.close()} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <form action={onHandleAdjustStock} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item *</label>
              <select
                name="item_id"
                required
                defaultValue={selectedItem?.id || ''}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
              >
                <option value="">Select item...</option>
                {items.filter((i) => i.status === 'active').map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock: {Number(item.quantity_in_stock ?? 0)} {item.unit || 'piece'})
                  </option>
                ))}
              </select>
            </div>
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
