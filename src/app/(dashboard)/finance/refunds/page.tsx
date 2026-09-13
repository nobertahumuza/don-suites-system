'use client';

import { useState, useEffect } from 'react';
import { createRefund, getRefunds, getRefundStats } from '@/lib/actions/finance';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ totalRefunds: 0, refundCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '', reference_type: '', payment_method: 'cash' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getRefunds(), getRefundStats()]);
      setRefunds(r);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRefund({ ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ amount: '', reason: '', reference_type: '', payment_method: 'cash' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-undo" style={{ color: '#c9a96e' }}></i> Refund Management
        </h1>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#dc2626' }}>
          <i className="fas fa-undo"></i> Process Refund
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-money-bill-wave text-sm mb-2 block" style={{ color: '#dc2626' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#dc2626' }}>{formatCurrency(stats.totalRefunds)}</div>
          <div className="text-[10px] text-gray-400 uppercase">Total Refunds</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-list text-sm mb-2 block" style={{ color: '#0f1a3c' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#0f1a3c' }}>{stats.refundCount}</div>
          <div className="text-[10px] text-gray-400 uppercase">Refund Count</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Date</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Description</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Method</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No refunds recorded</td></tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.transaction_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-xs">{r.description as string}</td>
                    <td className="px-4 py-3 text-xs capitalize">{(r.payment_method as string)?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 font-extrabold text-xs" style={{ color: '#dc2626' }}>{formatCurrency(Number(r.amount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 rounded-t-2xl text-white" style={{ background: 'linear-gradient(135deg, #991b1b, #dc2626)' }}>
              <h3 className="font-bold flex items-center gap-2"><i className="fas fa-undo"></i> Process Refund</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (UGX) *</label>
                <input type="number" min="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border-2 border-red-200 px-3 py-2.5 text-lg font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason *</label>
                <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why is this refund being processed?" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reference Type</label>
                  <select value={form.reference_type} onChange={(e) => setForm({ ...form, reference_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="">None</option>
                    <option value="booking">Booking</option>
                    <option value="fb_order">F&B Order</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#dc2626' }}>
                  <i className="fas fa-save mr-1"></i> Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
