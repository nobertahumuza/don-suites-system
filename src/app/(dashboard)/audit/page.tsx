'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    login: 'bg-indigo-100 text-indigo-700',
    status: 'bg-amber-100 text-amber-700',
    payment: 'bg-emerald-100 text-emerald-700',
    backup: 'bg-purple-100 text-purple-700',
    restore: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[action] || 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);

  const [filters, setFilters] = useState({ user: '', entity: '', action: '', date: '', search: '' });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (filters.user) params.set('user', filters.user);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.action) params.set('action', filters.action);
      if (filters.date) params.set('date', filters.date);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setUsers(data.users || []);
        setEntityTypes(data.entityTypes || []);
        setActionTypes(data.actionTypes || []);
      }
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [page, filters]);

  function toggleRow(id: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-history" style={{ color: '#c9a96e' }}></i>
              Activity Log
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Track all system changes and user actions</p>
          </div>
          <button onClick={() => loadData()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10">
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{total}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Activities</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{logs.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">On This Page</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{totalPages}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Pages</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{users.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Users</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[130px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">User</label>
            <select value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Users</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Entity</label>
            <select value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Types</option>
              {entityTypes.map((et: any) => <option key={et.entity_type} value={et.entity_type}>{et.entity_type}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Action</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Actions</option>
              {actionTypes.map((at: any) => <option key={at.action} value={at.action}>{at.action}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
            <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Search</label>
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Search..." />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-search mr-1"></i> Filter
          </button>
          <button type="button" onClick={() => { setFilters({ user: '', entity: '', action: '', date: '', search: '' }); setPage(1); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">
            Clear
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['#', 'Timestamp', 'User', 'Action', 'Entity', 'ID', 'IP Address', 'Details'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                    <i className="fas fa-history text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No activity found</p>
                  </td></tr>
                ) : (
                  logs.map((log: any, i: number) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 text-[11px] text-gray-400">{(page - 1) * 30 + i + 1}</td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-semibold">{log.full_name || 'System'}</div>
                        <div className="text-[10px] text-gray-400">{log.username}</div>
                      </td>
                      <td className="px-3 py-3"><ActionBadge action={log.action} /></td>
                      <td className="px-3 py-3 text-xs capitalize">{log.entity_type}</td>
                      <td className="px-3 py-3 text-xs">#{log.entity_id || '-'}</td>
                      <td className="px-3 py-3 text-[11px] text-gray-400 font-mono">{log.ip_address}</td>
                      <td className="px-3 py-3">
                        {(log.old_values || log.new_values) ? (
                          <>
                            <button onClick={() => toggleRow(log.id)} className="text-blue-600 text-[11px] font-semibold hover:underline">View</button>
                            {expandedRows.has(log.id) && (
                              <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-[10px] font-mono whitespace-pre-wrap break-all max-w-[300px]">
                                {log.old_values && <div><strong>Before:</strong><br />{JSON.stringify(JSON.parse(log.old_values), null, 2)}</div>}
                                {log.new_values && <div className="mt-1"><strong>After:</strong><br />{JSON.stringify(JSON.parse(log.new_values), null, 2)}</div>}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <small className="text-xs text-gray-400">Page {page} of {totalPages} ({total} records)</small>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
