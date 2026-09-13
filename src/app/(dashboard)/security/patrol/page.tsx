'use client';

import { useState, useEffect } from 'react';
import { getPatrolLogs, logPatrol } from '@/lib/actions/security';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    safe: 'bg-emerald-100 text-emerald-700',
    suspicious: 'bg-yellow-100 text-yellow-700',
    incident: 'bg-red-100 text-red-700',
    maintenance: 'bg-blue-100 text-blue-700',
  };
  const labels: Record<string, string> = {
    safe: 'Safe / Clear',
    suspicious: 'Suspicious',
    incident: 'Incident',
    maintenance: 'Maintenance',
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>;
}

export default function PatrolPage() {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ area: '', status: 'safe', notes: '' });

  async function loadData() {
    setLoading(true);
    try { setPatrols(await getPatrolLogs()); } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.area) { setMsg('Area is required'); return; }
    setSubmitting(true);
    setMsg('');
    try {
      await logPatrol(form);
      setMsg('Patrol logged successfully');
      setForm({ area: '', status: 'safe', notes: '' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to log patrol');
    }
    setSubmitting(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-shield-alt" style={{ color: '#c9a96e' }}></i>
              Security Patrol Log
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Record and track security patrol rounds</p>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <i className="fas fa-plus"></i> Log Patrol
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['Date/Time', 'Area', 'Status', 'Notes', 'Officer'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patrols.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">
                    <i className="fas fa-shield-alt text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No patrol logs yet</p>
                  </td></tr>
                ) : (
                  patrols.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{p.location}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.severity} /></td>
                      <td className="px-4 py-3 text-xs">{p.description || '-'}</td>
                      <td className="px-4 py-3 text-xs">{p.reported_by_name || 'N/A'}</td>
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
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #065f46, #059669)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fas fa-shield-alt"></i> Log Patrol
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-lg">&times;</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Area *</label>
                <input type="text" required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. Main Lobby, Parking, Kitchen" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Status *</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="safe">Safe / Clear</option>
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="incident">Incident Found</option>
                  <option value="maintenance">Maintenance Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" rows={3} placeholder="Any observations..."></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#059669' }}>
                  {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-save mr-1"></i> Log Patrol</>}
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
