'use client';

import { useState, useEffect } from 'react';
import { getIncidents, getIncidentStats, createIncident, updateIncidentStatus } from '@/lib/actions/security';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700',
    investigating: 'bg-blue-100 text-blue-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800',
  };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[severity] || 'bg-gray-100 text-gray-600'}`}>{severity}</span>;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState({ openCount: 0, todayCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ incident_type: '', severity: 'low', location: '', description: '', reported_by: '' });
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [i, s] = await Promise.all([getIncidents(), getIncidentStats()]);
      setIncidents(i);
      setStats(s);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description) { setMsg('Description is required'); return; }
    if (!form.incident_type) { setMsg('Incident type is required'); return; }
    setSubmitting(true);
    setMsg('');
    try {
      await createIncident(form);
      setMsg('Incident reported successfully');
      setForm({ incident_type: '', severity: 'low', location: '', description: '', reported_by: '' });
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to report incident');
    }
    setSubmitting(false);
  }

  async function handleUpdateStatus(id: number, status: string) {
    try {
      await updateIncidentStatus(id, status);
      loadData();
    } catch { /* empty */ }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-exclamation-triangle" style={{ color: '#c9a96e' }}></i>
          Security Incidents
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Report and manage security incidents</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.openCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Open Incidents</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.todayCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Reports</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0f1a3c]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.totalCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Incidents</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Report an Incident
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Incident Type *</label>
              <select required value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                <option value="">Select type...</option>
                <option value="theft">Theft</option>
                <option value="trespassing">Trespassing</option>
                <option value="disturbance">Disturbance</option>
                <option value="vandalism">Vandalism</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="fire_safety">Fire/Safety</option>
                <option value="vehicle_incident">Vehicle Incident</option>
                <option value="noise_complaint">Noise Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Severity *</label>
              <select required value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g., Lobby, Room 205" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reported By</label>
              <input type="text" value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Description *</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" rows={2} placeholder="Describe the incident..."></textarea>
          </div>
          <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
            {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Submitting...</> : <><i className="fas fa-paper-plane mr-1"></i> Submit Report</>}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list" style={{ color: '#c9a96e' }}></i> All Incidents
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['#', 'Type', 'Severity', 'Location', 'Description', 'Reported By', 'Date', 'Status', 'Action'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400">No incidents reported.</td></tr>
                ) : (
                  incidents.map((inc: any, i: number) => (
                    <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 text-xs font-semibold">{inc.incident_type?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-3"><SeverityBadge severity={inc.severity} /></td>
                      <td className="px-3 py-3 text-xs">{inc.location}</td>
                      <td className="px-3 py-3 text-xs max-w-[200px] truncate">{inc.description}</td>
                      <td className="px-3 py-3 text-xs">{inc.reported_by || inc.reporter_name || '-'}</td>
                      <td className="px-3 py-3 text-[11px] text-gray-400 whitespace-nowrap">{new Date(inc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                      <td className="px-3 py-3"><StatusBadge status={inc.status} /></td>
                      <td className="px-3 py-3">
                        <div className="relative group">
                          <button className="px-2 py-1 rounded-lg text-[10px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">Update</button>
                          <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                            <button onClick={() => handleUpdateStatus(inc.id, 'investigating')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">Mark Investigating</button>
                            <button onClick={() => handleUpdateStatus(inc.id, 'resolved')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">Mark Resolved</button>
                            <button onClick={() => handleUpdateStatus(inc.id, 'closed')} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50">Mark Closed</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
