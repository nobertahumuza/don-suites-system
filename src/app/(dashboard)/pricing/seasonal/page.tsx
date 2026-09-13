'use client';

import { useState, useEffect } from 'react';
import { getSeasonalPricing, getRoomTypes, addSeasonalPricing, deleteSeasonalPricing } from '@/lib/actions/pricing';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

export default function SeasonalPricingPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    room_type_id: '', season_name: '', start_date: '', end_date: '', price: '', cooking_space_price: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([getSeasonalPricing(), getRoomTypes()]);
      setSeasons(s);
      setRoomTypes(r);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.season_name || !form.start_date || !form.end_date || !form.price || !form.room_type_id) {
      setMsg('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    setMsg('');
    try {
      await addSeasonalPricing({
        room_type_id: Number(form.room_type_id),
        season_name: form.season_name,
        start_date: form.start_date,
        end_date: form.end_date,
        price: Number(form.price),
        cooking_space_price: form.cooking_space_price ? Number(form.cooking_space_price) : undefined,
      });
      setMsg('Seasonal pricing added!');
      setForm({ room_type_id: '', season_name: '', start_date: '', end_date: '', price: '', cooking_space_price: '' });
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to add');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this seasonal pricing?')) return;
    try {
      await deleteSeasonalPricing(id);
      loadData();
    } catch { /* empty */ }
  }

  function isActive(start: string, end: string) {
    const today = new Date().toISOString().split('T')[0];
    return today >= start && today <= end;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-sun" style={{ color: '#c9a96e' }}></i>
          Seasonal Pricing
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Configure seasonal room pricing rules</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Add Season
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Room Type *</label>
                <select required value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">Select room type...</option>
                  {roomTypes.map((rt: any) => <option key={rt.id} value={rt.id}>{rt.name} - {formatCurrency(rt.price)}/night</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Season Name *</label>
                <input type="text" required value={form.season_name} onChange={(e) => setForm({ ...form, season_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. Peak Season, Holiday" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Start Date *</label>
                  <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">End Date *</label>
                  <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Price per Night (UGX) *</label>
                <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Cooking Space Price (UGX)</label>
                <input type="number" value={form.cooking_space_price} onChange={(e) => setForm({ ...form, cooking_space_price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} placeholder="Optional" />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-save mr-1"></i> Save Season</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-sun" style={{ color: '#c9a96e' }}></i> Seasonal Pricing Rules
              </h3>
            </div>
            {loading ? (
              <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
            ) : seasons.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>
                <p className="text-sm">No seasonal pricing configured yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                      {['Room Type', 'Season', 'Period', 'Price', 'Cooking Space', 'Status', 'Action'].map((h) => (
                        <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seasons.map((s: any) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-3 text-xs">{s.room_type_name}</td>
                        <td className="px-3 py-3 text-xs font-semibold">{s.season_name}</td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap">{new Date(s.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(s.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-3 py-3 text-xs font-bold" style={{ color: '#0f1a3c' }}>{formatCurrency(s.price)}</td>
                        <td className="px-3 py-3 text-xs">{s.cooking_space_price ? formatCurrency(s.cooking_space_price) : 'N/A'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isActive(s.start_date, s.end_date) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isActive(s.start_date, s.end_date) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-red-500 hover:bg-red-600" title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
