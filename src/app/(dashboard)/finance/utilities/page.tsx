'use client';

import { useState, useEffect } from 'react';
import { createUtilityBill, markUtilityBillPaid, deleteUtilityBill, getUtilityBills, getUtilityStats } from '@/lib/actions/finance';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

const typeIcons: Record<string, string> = { electricity: 'fa-bolt', water: 'fa-tint', internet: 'fa-wifi', gas: 'fa-fire', other: 'fa-plug' };
const typeColors: Record<string, string> = { electricity: '#f59e0b', water: '#3b82f6', internet: '#8b5cf6', gas: '#ef4444', other: '#94a3b8' };

export default function UtilitiesPage() {
  const [bills, setBills] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ pendingTotal: 0, paidThisMonth: 0, pendingCount: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<number | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [form, setForm] = useState({ utility_type: 'electricity', provider: '', account_number: '', bill_month: new Date().toISOString().slice(0, 7), amount: '', due_date: '', notes: '' });

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([getUtilityBills(filter !== 'all' ? filter : undefined), getUtilityStats()]);
      setBills(b);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUtilityBill({ ...form, amount: Number(form.amount) });
      setForm({ utility_type: 'electricity', provider: '', account_number: '', bill_month: new Date().toISOString().slice(0, 7), amount: '', due_date: '', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleMarkPaid(billId: number) {
    try {
      await markUtilityBillPaid(billId, receiptNumber);
      setPayModal(null);
      setReceiptNumber('');
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(billId: number) {
    if (!confirm('Delete this record?')) return;
    try {
      await deleteUtilityBill(billId);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#0f1a3c' }}>
        <i className="fas fa-bolt" style={{ color: '#c9a96e' }}></i> Utility Bills
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100" style={{ borderLeft: '4px solid #ef4444' }}>
          <i className="fas fa-file-invoice-dollar text-sm mb-2 block" style={{ color: '#ef4444' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#ef4444' }}>{formatCurrency(stats.pendingTotal)}</div>
          <div className="text-[10px] text-gray-400 uppercase">Pending Bills ({stats.pendingCount} unpaid)</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100" style={{ borderLeft: '4px solid #10b981' }}>
          <i className="fas fa-check-double text-sm mb-2 block" style={{ color: '#10b981' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#10b981' }}>{formatCurrency(stats.paidThisMonth)}</div>
          <div className="text-[10px] text-gray-400 uppercase">Paid This Month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Utility Bill
              </h3>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Utility Type *</label>
                <select value={form.utility_type} onChange={(e) => setForm({ ...form, utility_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="electricity">Electricity (UMEME)</option>
                  <option value="water">Water (NWSC)</option>
                  <option value="internet">Internet/WiFi</option>
                  <option value="gas">Cooking Gas</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Provider</label>
                <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. UMEME, NWSC" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account Number</label>
                <input type="text" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="Account/Meter number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bill Month *</label>
                <input type="month" required value={form.bill_month} onChange={(e) => setForm({ ...form, bill_month: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (UGX) *</label>
                <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Optional notes" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> Record Bill
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-file-invoice" style={{ color: '#c9a96e' }}></i> Utility Bills
              </h3>
              <div className="flex gap-1">
                {['all', 'pending', 'paid', 'overdue'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={filter === f ? { background: f === 'pending' ? '#f59e0b' : f === 'paid' ? '#10b981' : f === 'overdue' ? '#ef4444' : '#0f1a3c' } : {}}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Type</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Provider</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Month</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Amount</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Due</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
                  ) : bills.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No utility bills found</td></tr>
                  ) : (
                    bills.map((b) => {
                      const icon = typeIcons[b.utility_type as string] || 'fa-plug';
                      const color = typeColors[b.utility_type as string] || '#94a3b8';
                      return (
                        <tr key={b.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3"><i className={`fas ${icon} mr-1.5`} style={{ color }}></i>{(b.utility_type as string).charAt(0).toUpperCase() + (b.utility_type as string).slice(1)}</td>
                          <td className="px-4 py-3 text-xs">{(b.provider as string) || '-'}</td>
                          <td className="px-4 py-3 text-xs">{new Date((b.bill_month as string) + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 font-bold text-xs">{formatCurrency(Number(b.amount))}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{b.due_date ? new Date(b.due_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</td>
                          <td className="px-4 py-3">
                            {b.status === 'paid' ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Paid {b.paid_date ? new Date(b.paid_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                            ) : b.status === 'overdue' ? (
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Overdue</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {b.status !== 'paid' && (
                                <button onClick={() => { setPayModal(b.id as number); setReceiptNumber(''); }} className="px-2 py-1 rounded text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600"><i className="fas fa-check mr-1"></i>Pay</button>
                              )}
                              <button onClick={() => handleDelete(b.id as number)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
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
        </div>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold">Mark as Paid</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Receipt Number</label>
                <input type="text" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} placeholder="Optional receipt #" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
                <button type="button" onClick={() => handleMarkPaid(payModal)} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600">Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
