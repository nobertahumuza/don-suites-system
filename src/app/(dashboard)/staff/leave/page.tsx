'use client';

import { useState, useEffect } from 'react';
import { getLeave, getLeaveStats, getActiveStaffList, createLeave, updateLeave } from '@/lib/actions/staff';

const typeColors: Record<string, string> = { annual: '#3b82f6', sick: '#ef4444', maternity: '#8b5cf6', paternity: '#3b82f6', unpaid: '#f59e0b', off_day: '#10b981', other: '#94a3b8' };

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
  const bg: Record<string, string> = { pending: '#fffbeb', approved: '#ecfdf5', rejected: '#fef2f2' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: bg[status] || '#f3f4f6', color: colors[status] || '#6b7280' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Array<Record<string, unknown>>>([]);
  const [staffList, setStaffList] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ pending: 0, approvedThisMonth: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', notes: '' });

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const [l, s, sl] = await Promise.all([
        getLeave({ status: filter !== 'all' ? filter : undefined }),
        getLeaveStats(),
        getActiveStaffList()
      ]);
      setLeaves(l);
      setStats(s);
      setStaffList(sl);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCreateLeave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLeave({
        staff_id: Number(form.staff_id),
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
        notes: form.notes,
      });
      setForm({ staff_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleApproveReject(id: number, action: 'approved' | 'rejected') {
    try {
      await updateLeave(id, action);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#0f1a3c' }}>
        <i className="fas fa-calendar-times" style={{ color: '#c9a96e' }}></i> Leave Management
      </h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-clock text-sm mb-2 block" style={{ color: '#f59e0b' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#f59e0b' }}>{stats.pending}</div>
          <div className="text-[10px] text-gray-400 uppercase">Pending Requests</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <i className="fas fa-check text-sm mb-2 block" style={{ color: '#10b981' }}></i>
          <div className="text-lg font-extrabold" style={{ color: '#10b981' }}>{stats.approvedThisMonth}</div>
          <div className="text-[10px] text-gray-400 uppercase">Approved This Month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Request Leave
              </h3>
            </div>
            <form onSubmit={handleCreateLeave} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Staff Member *</label>
                <select required value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>{String(s.full_name)} ({String(s.position)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Leave Type *</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  {['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'off_day', 'other'].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From *</label>
                  <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To *</label>
                  <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Reason for leave" />
              </div>
              <button type="submit" className="w-full py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-paper-plane mr-1"></i> Submit Request
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-calendar-times" style={{ color: '#c9a96e' }}></i> Leave Records
              </h3>
              <div className="flex gap-1">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={filter === f ? { background: f === 'pending' ? '#f59e0b' : f === 'approved' ? '#10b981' : f === 'rejected' ? '#ef4444' : '#0f1a3c' } : {}}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Staff</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Type</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Period</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Days</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Reason</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                    <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
                  ) : leaves.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No leave records found</td></tr>
                  ) : (
                    leaves.map((l) => {
                      const color = typeColors[l.leave_type as string] || '#94a3b8';
                      return (
                        <tr key={l.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-xs">{l.full_name as string}</div>
                            <div className="text-[10px] text-gray-400">{l.position as string}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold border" style={{ background: `${color}20`, color, borderColor: `${color}40` }}>
                              {(l.leave_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(l.start_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(l.end_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-xs">{l.days as number}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">{(l.reason as string) || '-'}</td>
                          <td className="px-4 py-3"><StatusBadge status={l.status as string} /></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {l.status === 'pending' && (
                                <>
                                  <button onClick={() => handleApproveReject(l.id as number, 'approved')} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-emerald-200 text-emerald-600 hover:bg-emerald-50" title="Approve"><i className="fas fa-check"></i></button>
                                  <button onClick={() => handleApproveReject(l.id as number, 'rejected')} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50" title="Reject"><i className="fas fa-times"></i></button>
                                </>
                              )}
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
    </div>
  );
}
