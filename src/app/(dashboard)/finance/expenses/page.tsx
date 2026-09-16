'use client';

import { useState, useEffect } from 'react';
import { createExpense, deleteExpense, getExpenses, getExpenseStats, getExpenseCategories } from '@/lib/actions/finance';
import Pagination from '@/components/Pagination';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

const PAGE_SIZE = 20;

export default function ExpensesPage() {
  const [allExpenses, setAllExpenses] = useState<Array<Record<string, unknown>>>([]);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ totalExpenses: 0, monthExpenses: 0, todayExpenses: 0, todayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ category: '', description: '', notes: '', amount: '', payment_method: 'cash', transaction_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { setPage(1); }, [dateFrom, dateTo, categoryFilter]);
  useEffect(() => { loadData(); }, [dateFrom, dateTo, categoryFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [e, s, c] = await Promise.all([
        getExpenses({ date_from: dateFrom || undefined, date_to: dateTo || undefined, category: categoryFilter || undefined }),
        getExpenseStats(),
        getExpenseCategories()
      ]);
      setAllExpenses(e);
      setStats(s);
      setCategories(c);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const totalPages = Math.max(1, Math.ceil(allExpenses.length / PAGE_SIZE));
  const expenses = allExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createExpense({ ...form, amount: Number(form.amount) });
      setForm({ category: '', description: '', notes: '', amount: '', payment_method: 'cash', transaction_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  const methodClasses: Record<string, string> = { cash: 'bg-emerald-50 text-emerald-700', mobile_money: 'bg-amber-50 text-amber-700', bank_transfer: 'bg-blue-50 text-blue-700', card: 'bg-indigo-50 text-indigo-700' };

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-wallet" style={{ color: '#c9a96e' }}></i> Expense Tracking
        </h1>
        <p className="text-xs opacity-60 mt-1">Record and track all hotel expenses with notes</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Expenses', value: formatCurrency(stats.totalExpenses), icon: 'fas fa-receipt', color: '#0f1a3c', border: '#0f1a3c' },
          { label: 'This Month', value: formatCurrency(stats.monthExpenses), icon: 'fas fa-calendar-alt', color: '#c9a96e', border: '#c9a96e' },
          { label: "Today's Expenses", value: formatCurrency(stats.todayExpenses), icon: 'fas fa-calendar-day', color: '#ef4444', border: '#ef4444' },
          { label: "Today's Entries", value: stats.todayCount, icon: 'fas fa-list', color: '#10b981', border: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden" style={{ borderLeft: `4px solid ${s.border}` }}>
            <i className={`${s.icon} text-sm mb-2 block`} style={{ color: s.color }}></i>
            <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 rounded-t-xl text-white" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
              <h3 className="text-sm font-bold"><i className="fas fa-plus-circle mr-2" style={{ color: '#c9a96e' }}></i>Record Expense</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.name as string} value={c.name as string}>{c.name as string}</option>)}
                  <option value="Staff Salaries">Staff Salaries</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description *</label>
                <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Cleaning supplies" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="What was used" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (UGX) *</label>
                <input type="number" step="100" min="100" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment *</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date *</label>
                  <input type="date" required value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #c9a96e, #b8944f)' }}>
                <i className="fas fa-save mr-1"></i> Record Expense
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.name as string} value={c.name as string}>{c.name as string}</option>)}
                </select>
              </div>
              <button onClick={() => { setDateFrom(''); setDateTo(''); setCategoryFilter(''); }} className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Date</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Description</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Notes</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Category</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Amount</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Payment</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-receipt text-3xl mb-2 block opacity-30"></i>No expenses recorded</td></tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.transaction_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-4 py-3 font-bold text-xs">{e.description as string}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{e.notes ? <><i className="fas fa-sticky-note mr-1" style={{ color: '#c9a96e' }}></i>{(e.notes as string).substring(0, 60)}</> : '-'}</td>
                        <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">{e.category as string}</span></td>
                        <td className="px-4 py-3 font-extrabold text-xs" style={{ color: '#ef4444' }}>-{formatCurrency(Number(e.amount))}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${methodClasses[e.payment_method as string] || 'bg-gray-100 text-gray-600'}`}>
                            {(e.payment_method as string)?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(e.id as number)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] bg-red-50 text-red-600 hover:bg-red-100" title="Delete"><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <small className="text-xs text-gray-400">Page {page} of {totalPages} ({allExpenses.length} records)</small>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
