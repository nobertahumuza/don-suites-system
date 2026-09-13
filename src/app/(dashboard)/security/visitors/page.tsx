'use client';

import { useState, useEffect } from 'react';
import { getVisitors, logVisitor, checkoutVisitor } from '@/lib/actions/security';

export default function VisitorsPage() {
  const [data, setData] = useState<any>({ todayVisitors: [], activeVisitors: [], recentVisitors: [], stats: { today: 0, active: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_id_number: '', purpose: '', visiting_guest: '', room_number: '', vehicle_number: '',
  });

  async function loadData() {
    setLoading(true);
    try { setData(await getVisitors()); } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.visitor_name) { setMsg('Visitor name is required'); return; }
    setSubmitting(true);
    setMsg('');
    try {
      await logVisitor(form);
      setMsg('Visitor logged successfully');
      setForm({ visitor_name: '', visitor_phone: '', visitor_id_number: '', purpose: '', visiting_guest: '', room_number: '', vehicle_number: '' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to log visitor');
    }
    setSubmitting(false);
  }

  async function handleCheckout(id: number) {
    if (!confirm('Check out this visitor?')) return;
    try {
      await checkoutVisitor(id);
      loadData();
    } catch { /* empty */ }
  }

  function calcDuration(timeIn: string, timeOut?: string | null) {
    const start = new Date(timeIn);
    const end = timeOut ? new Date(timeOut) : new Date();
    const diffMin = Math.floor((end.getTime() - start.getTime()) / 60000);
    return diffMin >= 60 ? (diffMin / 60).toFixed(1) + 'h' : diffMin + 'm';
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-user-shield" style={{ color: '#c9a96e' }}></i>
              Visitor Log
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Track visitor check-in and check-out</p>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <i className="fas fa-plus"></i> Log Visitor
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0f1a3c]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.stats.active}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Currently On-site</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.stats.today}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Visitors</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-history"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.stats.total}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Logged</div>
        </div>
      </div>

      {data.activeVisitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-circle text-[8px]" style={{ color: '#10b981' }}></i> Currently On-site ({data.activeVisitors.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['Name', 'Phone', 'Purpose', 'Visiting', 'Room', 'Vehicle', 'Time In', 'Action'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.activeVisitors.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-xs font-semibold">{v.visitor_name}</td>
                    <td className="px-3 py-3 text-xs">{v.visitor_phone}</td>
                    <td className="px-3 py-3 text-xs">{v.purpose}</td>
                    <td className="px-3 py-3 text-xs">{v.visiting_guest}</td>
                    <td className="px-3 py-3 text-xs">{v.room_number}</td>
                    <td className="px-3 py-3 text-xs">{v.vehicle_number}</td>
                    <td className="px-3 py-3 text-xs">{new Date(v.time_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => handleCheckout(v.id)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600">
                        <i className="fas fa-sign-out-alt mr-1"></i> Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-history" style={{ color: '#c9a96e' }}></i> Recent Visitors
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['#', 'Name', 'Phone', 'Purpose', 'Visiting', 'Room', 'Vehicle', 'Time In', 'Time Out', 'Duration'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentVisitors.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-10 text-gray-400">No visitors logged yet.</td></tr>
                ) : (
                  data.recentVisitors.map((v: any, i: number) => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 text-xs font-semibold">{v.visitor_name}</td>
                      <td className="px-3 py-3 text-xs">{v.visitor_phone}</td>
                      <td className="px-3 py-3 text-xs">{v.purpose}</td>
                      <td className="px-3 py-3 text-xs">{v.visiting_guest}</td>
                      <td className="px-3 py-3 text-xs">{v.room_number}</td>
                      <td className="px-3 py-3 text-xs">{v.vehicle_number}</td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{new Date(v.time_in).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                      <td className="px-3 py-3 text-xs">
                        {v.time_out ? new Date(v.time_out).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">On-site</span>}
                      </td>
                      <td className="px-3 py-3 text-xs">{calcDuration(v.time_in, v.time_out)}</td>
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
                  <i className="fas fa-user-shield" style={{ color: '#c9a96e' }}></i> Log New Visitor
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Visitor Name *</label>
                <input type="text" required value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Phone</label>
                  <input type="text" value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">ID Number</label>
                  <input type="text" value={form.visitor_id_number} onChange={(e) => setForm({ ...form, visitor_id_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Purpose of Visit</label>
                <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g., Business meeting, social visit" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Visiting Guest Name</label>
                  <input type="text" value={form.visiting_guest} onChange={(e) => setForm({ ...form, visiting_guest: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Room Number</label>
                  <input type="text" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Vehicle Number</label>
                <input type="text" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g., UAX 123A" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                  {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-save mr-1"></i> Log Visitor</>}
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
