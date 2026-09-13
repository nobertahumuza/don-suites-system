'use client';

import { useState, useEffect } from 'react';
import { getDiscounts, createDiscount, deleteDiscount } from '@/lib/actions/pricing';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

export default function DiscountsPage() {
  const [data, setData] = useState<any>({ discounts: [], stats: { total: 0, active: 0, expired: 0, totalUses: 0 } });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '',
    applies_to: 'all', valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active',
  });

  async function loadData() {
    setLoading(true);
    try { setData(await getDiscounts(filterStatus ? { status: filterStatus } : undefined)); } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [filterStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code) { setMsg('Code is required'); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) { setMsg('Discount value must be positive'); return; }
    setSubmitting(true);
    setMsg('');
    try {
      await createDiscount({
        ...form,
        discount_value: Number(form.discount_value),
        min_amount: form.min_amount ? Number(form.min_amount) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : 0,
      });
      setMsg('Discount code created successfully');
      setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_amount: '', max_uses: '', applies_to: 'all', valid_from: new Date().toISOString().split('T')[0], valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to create discount');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this discount code?')) return;
    try {
      await deleteDiscount(id);
      loadData();
    } catch { /* empty */ }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-tags" style={{ color: '#c9a96e' }}></i>
              Discounts &amp; Coupons
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage promotional codes and discounts</p>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#c9a96e' }}>
            <i className="fas fa-plus"></i> New Discount
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{data.stats.total}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Codes</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#059669' }}>{data.stats.active}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#dc2626' }}>{data.stats.expired}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Expired</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#2563eb' }}>{data.stats.totalUses}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Uses</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 gap-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list" style={{ color: '#c9a96e' }}></i> All Discount Codes
          </h3>
          <div className="flex gap-1">
            {(['active', 'inactive', ''] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${filterStatus === s ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={filterStatus === s ? { background: s === 'active' ? '#059669' : s === 'inactive' ? '#64748b' : '#0f1a3c' } : {}}>
                {s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'All'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['Code', 'Type', 'Value', 'Min Amount', 'Applies To', 'Uses', 'Valid Period', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.discounts.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                    <i className="fas fa-tags text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No discount codes yet</p>
                  </td></tr>
                ) : (
                  data.discounts.map((d: any) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3">
                        <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded" style={{ color: '#0f1a3c', letterSpacing: '1px' }}>{d.code}</span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <i className={`fas ${d.discount_type === 'percentage' ? 'fa-percent' : 'fa-minus-circle'} mr-1`}></i>
                        {d.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold">{d.discount_type === 'percentage' ? `${d.discount_value}%` : formatCurrency(d.discount_value)}</td>
                      <td className="px-3 py-3 text-xs">{d.min_amount > 0 ? formatCurrency(d.min_amount) : <span className="text-gray-300">None</span>}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${d.applies_to === 'all' ? 'bg-blue-100 text-blue-700' : d.applies_to === 'fb' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {d.applies_to === 'all' ? 'All' : d.applies_to === 'fb' ? 'F&B' : 'Bookings'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">{d.used_count}{d.max_uses > 0 ? ` / ${d.max_uses}` : ''}</td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{new Date(d.valid_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(d.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => handleDelete(d.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-red-500 hover:bg-red-600" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Create Discount Code
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Code *</label>
                  <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono uppercase" placeholder="e.g. SUMMER20" style={{ letterSpacing: '1px' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Type *</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (UGX)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Value *</label>
                  <input type="number" required value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} step="0.01" placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Min Amount</label>
                  <input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} step={100} placeholder="0 = no minimum" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Max Uses (0=unlimited)</label>
                  <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Applies To</label>
                  <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="all">All</option>
                    <option value="fb">F&amp;B Only</option>
                    <option value="booking">Bookings Only</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Valid From *</label>
                  <input type="date" required value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Valid Until *</label>
                  <input type="date" required value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. Summer promotion" />
              </div>
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#c9a96e' }}>
                  {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Creating...</> : <><i className="fas fa-save mr-1"></i> Create</>}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
