'use client';

import { useState, useEffect } from 'react';

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({ total: 0, totalSize: '0 MB', diskFree: '0 GB', diskTotal: '0 GB' });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/backup/list');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setStats(data.stats || { total: 0, totalSize: '0 MB', diskFree: '0 GB', diskTotal: '0 GB' });
      }
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateBackup() {
    if (!confirm('Create a new database backup?')) return;
    setCreating(true);
    setMsg('');
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg(`Backup created: ${data.filename} (${data.size})`);
        loadData();
      } else {
        setMsg(data.error || 'Backup failed');
      }
    } catch (err: any) {
      setMsg(err.message || 'Backup failed');
    }
    setCreating(false);
  }

  async function handleRestore(filename: string) {
    if (!confirm('Restore database from this backup? This will overwrite current data!')) return;
    setMsg('');
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filename }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`Database restored from: ${filename}`);
      } else {
        setMsg(data.error || 'Restore failed');
      }
    } catch (err: any) {
      setMsg(err.message || 'Restore failed');
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm('Delete this backup permanently?')) return;
    try {
      await fetch('/api/backup/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filename }),
      });
      loadData();
    } catch { /* empty */ }
  }

  function handleDownload(filename: string) {
    const a = document.createElement('a');
    a.href = `/api/backup/download?file=${encodeURIComponent(filename)}`;
    a.download = filename;
    a.click();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-database" style={{ color: '#c9a96e' }}></i>
              Database Backup
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Create, restore, and manage database backups</p>
          </div>
          <button onClick={handleCreateBackup} disabled={creating} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: '#c9a96e' }}>
            {creating ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-download"></i> Create Backup Now</>}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') || msg.includes('created') || msg.includes('restored') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') || msg.includes('created') || msg.includes('restored') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{stats.total}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Backups</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-lg font-extrabold" style={{ color: '#0f1a3c' }}>{stats.totalSize}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Size</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-lg font-extrabold" style={{ color: '#059669' }}>{stats.diskFree}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Disk Free</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-lg font-extrabold" style={{ color: '#0f1a3c' }}>{stats.diskTotal}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Disk Total</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list" style={{ color: '#c9a96e' }}></i> Backup History
          </h3>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : backups.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fas fa-database text-4xl mb-3 block opacity-30"></i>
            <p className="text-sm font-semibold">No backups yet</p>
            <p className="text-xs mt-1">Click &quot;Create Backup Now&quot; to create your first backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['Filename', 'Size', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backups.map((b: any) => (
                  <tr key={b.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-xs" style={{ color: '#0f1a3c' }}>{b.name}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{b.sizeDisplay}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{b.dateDisplay}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleDownload(b.name)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-blue-500 hover:bg-blue-600" title="Download">
                          <i className="fas fa-download"></i>
                        </button>
                        <button onClick={() => handleRestore(b.name)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-amber-500 hover:bg-amber-600" title="Restore">
                          <i className="fas fa-undo"></i>
                        </button>
                        <button onClick={() => handleDelete(b.name)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-red-500 hover:bg-red-600" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mt-6 text-amber-800 text-xs">
        <i className="fas fa-exclamation-triangle mr-1"></i>
        <strong>Important:</strong> Backups are stored in the server&apos;s backups directory. Download important backups to a safe location. Restore will overwrite all current data.
      </div>
    </div>
  );
}
