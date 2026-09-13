'use client';

import { useState, useEffect } from 'react';
import { getStaff, getStaffStats, createStaff, updateStaff, deleteStaff } from '@/lib/actions/staff';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#991b1b' }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalWages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    full_name: '', gender: '', phone: '', email: '', position: '', department: '',
    contract_type: 'permanent', wage: '', hire_date: '', status: 'active'
  });

  useEffect(() => { loadData(); }, [statusFilter, search]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        getStaff({ status: statusFilter || undefined, search: search || undefined }),
        getStaffStats()
      ]);
      setStaff(s);
      setStats(st);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openAdd() {
    setEditItem(null);
    setForm({ full_name: '', gender: '', phone: '', email: '', position: '', department: '', contract_type: 'permanent', wage: '', hire_date: '', status: 'active' });
    setShowModal(true);
  }

  function openEdit(item: Record<string, unknown>) {
    setEditItem(item);
    setForm({
      full_name: (item.full_name as string) || '',
      gender: (item.gender as string) || '',
      phone: (item.phone as string) || '',
      email: (item.email as string) || '',
      position: (item.position as string) || '',
      department: (item.department as string) || '',
      contract_type: (item.contract_type as string) || 'permanent',
      wage: String(item.wage ?? ''),
      hire_date: (item.hire_date as string) || '',
      status: (item.status as string) || 'active',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, wage: Number(form.wage) || 0 };
      if (editItem) {
        await updateStaff(editItem.id as number, payload);
      } else {
        await createStaff(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this staff member?')) return;
    try {
      await deleteStaff(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-users" style={{ color: '#c9a96e' }}></i> Staff Management
        </h1>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#059669' }}>
          <i className="fas fa-user-plus"></i> New Staff
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Staff', value: stats.total, icon: 'fas fa-users', color: '#0f1a3c', bg: '#eef2ff' },
          { label: 'Active', value: stats.active, icon: 'fas fa-check-circle', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Inactive', value: stats.inactive, icon: 'fas fa-user-slash', color: '#ef4444', bg: '#fef2f2' },
          { label: 'Monthly Wages', value: formatCurrency(stats.totalWages), icon: 'fas fa-money-bill', color: '#c9a96e', bg: '#fffbeb' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <i className={`${s.icon} text-sm mb-2 block`} style={{ color: s.color }}></i>
            <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, position, phone..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Staff</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Position</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Department</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Contract</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Wage</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Phone</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Hire Date</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No staff found</td></tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                          {((s.full_name as string) || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs">{s.full_name as string}</div>
                          {s.gender ? <div className="text-[10px] text-gray-400 capitalize">{String(s.gender)}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{s.position as string}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{(s.department as string) || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold capitalize">{(s.contract_type as string) || 'permanent'}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(Number(s.wage) || 0)}</td>
                    <td className="px-4 py-3 text-xs">{(s.phone as string) || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.hire_date ? new Date(s.hire_date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status as string} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDelete(s.id as number)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-user-edit" style={{ color: '#c9a96e' }}></i> {editItem ? 'Edit Staff' : 'Add Staff'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Position *</label>
                  <input type="text" required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contract Type</label>
                  <select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Wage (UGX)</label>
                  <input type="number" min="0" value={form.wage} onChange={(e) => setForm({ ...form, wage: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Hire Date</label>
                  <input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> {editItem ? 'Update Staff' : 'Add Staff'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
