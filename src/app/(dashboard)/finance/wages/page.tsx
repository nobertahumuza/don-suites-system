'use client';

import { useState, useEffect } from 'react';
import { createWage, getWages, getWageStats } from '@/lib/actions/finance';
import { getActiveStaffList } from '@/lib/actions/staff';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

const methodBadges: Record<string, { bg: string; color: string; icon: string }> = {
  cash: { bg: '#dcfce7', color: '#166534', icon: 'fa-money-bill' },
  momo: { bg: '#fef9c3', color: '#854d0e', icon: 'fa-mobile-alt' },
  airtel_money: { bg: '#fee2e2', color: '#991b1b', icon: 'fa-mobile-alt' },
  bank: { bg: '#dbeafe', color: '#1e40af', icon: 'fa-university' },
  cheque: { bg: '#f3e8ff', color: '#6b21a8', icon: 'fa-check' },
};

export default function WagesPage() {
  const [wages, setWages] = useState<Array<Record<string, unknown>>>([]);
  const [staffList, setStaffList] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ totalPaid: 0, staffCount: 0, methodStats: [] as Array<Record<string, unknown>> });
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staff_id: '', amount: '', pay_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '' });

  useEffect(() => { loadData(); }, [month, methodFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [w, s, sl] = await Promise.all([
        getWages({ month, method: methodFilter || undefined }),
        getWageStats(month),
        getActiveStaffList()
      ]);
      setWages(w);
      setStats(s);
      setStaffList(sl);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function prevMonth() {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  }

  function nextMonth() {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + 1);
    setMonth(d.toISOString().slice(0, 7));
  }

  function thisMonth() {
    setMonth(new Date().toISOString().slice(0, 7));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createWage({ ...form, staff_id: Number(form.staff_id), amount: Number(form.amount) });
      setForm({ staff_id: '', amount: '', pay_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  function autoFillWage(staffId: string) {
    const staff = staffList.find((s) => s.id === Number(staffId));
    if (staff) setForm({ ...form, staff_id: staffId, amount: String(staff.wage || '') });
  }

  const methodMap: Record<string, { total: number; count: number }> = {};
  (stats.methodStats as Array<Record<string, unknown>>).forEach((m) => {
    methodMap[m.payment_method as string] = { total: Number(m.total), count: Number(m.count) };
  });

  const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const showAccountField = ['momo', 'airtel_money', 'bank'].includes(form.payment_method);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-money-check-alt" style={{ color: '#c9a96e' }}></i> Staff Wages - {monthName}
        </h1>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: '#0f1a3c' }}><i className="fas fa-chevron-left"></i></button>
          <button onClick={thisMonth} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#c9a96e' }}>This Month</button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: '#0f1a3c' }}><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Paid', value: formatCurrency(stats.totalPaid), icon: 'fas fa-money-bill-wave', color: '#8b5cf6' },
          { label: 'Staff Paid', value: stats.staffCount, icon: 'fas fa-users', color: '#3b82f6' },
          { label: 'Cash Payments', value: formatCurrency(methodMap['cash']?.total || 0), icon: 'fas fa-hand-holding', color: '#10b981', sub: `${methodMap['cash']?.count || 0} payments` },
          { label: 'Mobile Money', value: formatCurrency((methodMap['momo']?.total || 0) + (methodMap['airtel_money']?.total || 0)), icon: 'fas fa-mobile-alt', color: '#f59e0b', sub: `${(methodMap['momo']?.count || 0) + (methodMap['airtel_money']?.count || 0)} payments` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <i className={`${s.icon} text-sm mb-2 block`} style={{ color: s.color }}></i>
            <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
            {s.sub && <div className="text-[10px] text-gray-400">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'All', icon: '' },
          { value: 'cash', label: 'Cash', icon: 'fa-money-bill' },
          { value: 'momo', label: 'MTN MoMo', icon: 'fa-mobile-alt' },
          { value: 'airtel_money', label: 'Airtel Money', icon: 'fa-mobile-alt' },
          { value: 'bank', label: 'Bank Transfer', icon: 'fa-university' },
          { value: 'cheque', label: 'Cheque', icon: 'fa-check' },
        ].map((m) => (
          <button key={m.value} onClick={() => setMethodFilter(m.value)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${methodFilter === m.value ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={methodFilter === m.value ? { background: m.value === 'cash' ? '#10b981' : m.value === 'momo' ? '#f59e0b' : m.value === 'airtel_money' ? '#ef4444' : m.value === 'bank' ? '#3b82f6' : m.value === 'cheque' ? '#6b7280' : '#0f1a3c' } : {}}>
            {m.icon && <i className={`fas ${m.icon} mr-1`}></i>}{m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Record Wage Payment
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Staff Member *</label>
                <select required value={form.staff_id} onChange={(e) => autoFillWage(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>{String(s.full_name)} ({String(s.position)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (UGX) *</label>
                <input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Method *</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="cash">Cash</option>
                  <option value="momo">MTN Mobile Money (MoMo)</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              {showAccountField && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account / Phone Number</label>
                  <input type="text" placeholder="e.g. 0771234567" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pay Date *</label>
                <input type="date" required value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. Salary for July 2026" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> Record Payment
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-history" style={{ color: '#c9a96e' }}></i> Payment History {methodFilter ? `(${methodFilter.replace(/_/g, ' ')})` : ''}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Staff</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Amount</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Method</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Date</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
                  ) : wages.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">No wage records for this month</td></tr>
                  ) : (
                    wages.map((w) => {
                      const mb = methodBadges[w.payment_method as string] || { bg: '#f1f5f9', color: '#475569', icon: 'fa-circle' };
                      return (
                        <tr key={w.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-xs">{w.full_name as string}</div>
                            <div className="text-[10px] text-gray-400">{w.position as string}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-sm" style={{ color: '#0f1a3c' }}>{formatCurrency(Number(w.amount))}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: mb.bg, color: mb.color }}>
                              <i className={`fas ${mb.icon}`} style={{ fontSize: 9 }}></i>{(w.payment_method as string).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(w.pay_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{(w.notes as string) || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {wages.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f0f4ff', fontWeight: 700 }}>
                      <td className="px-4 py-3 text-xs font-bold">TOTAL</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: '#0f1a3c' }}>{formatCurrency(stats.totalPaid)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
