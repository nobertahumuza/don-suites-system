'use client';

import { useState, useEffect } from 'react';
import { getUsers, toggleUserStatus, resetUserPassword } from '@/lib/actions/staff';

const roleColors: Record<string, string> = { admin: '#0f1a3c', reception: '#7c3aed', storekeeper: '#059669', security: '#dc2626' };
const roleIcons: Record<string, string> = { admin: 'fa-shield-halved', reception: 'fa-bell-concierge', storekeeper: 'fa-warehouse', security: 'fa-shield' };

export default function UsersPage() {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [resetModal, setResetModal] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleToggleStatus(userId: number) {
    if (!confirm('Toggle user status?')) return;
    try {
      const result = await toggleUserStatus(userId);
      setMessage({ type: 'success', text: `User status updated to ${result.status}` });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }
    try {
      await resetUserPassword(resetModal!, newPassword);
      setMessage({ type: 'success', text: 'Password reset successfully' });
      setResetModal(null);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
    }
  }

  const roleCounts: Record<string, number> = {};
  users.forEach((u) => {
    const r = u.role as string;
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-user-shield" style={{ color: '#c9a96e' }}></i> User Management
        </h1>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>{users.length} Users</span>
      </div>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Admins', value: roleCounts['admin'] || 0, icon: 'fa-shield-halved', color: '#0f1a3c' },
          { label: 'Reception', value: roleCounts['reception'] || 0, icon: 'fa-bell-concierge', color: '#7c3aed' },
          { label: 'Storekeeper', value: roleCounts['storekeeper'] || 0, icon: 'fa-warehouse', color: '#059669' },
          { label: 'Security', value: roleCounts['security'] || 0, icon: 'fa-shield', color: '#dc2626' },
        ].map((r) => (
          <div key={r.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <i className={`fas ${r.icon} text-sm mb-2 block`} style={{ color: r.color }}></i>
            <div className="text-lg font-extrabold" style={{ color: r.color }}>{r.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{r.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">User</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Username</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Role</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Password</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status Control</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => {
                  const rc = roleColors[u.role as string] || '#64748b';
                  const ri = roleIcons[u.role as string] || 'fa-user';
                  return (
                    <tr key={u.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                            {((u.full_name as string) || '?')[0]?.toUpperCase()}
                          </div>
                          <div className="font-bold text-xs">{u.full_name as string}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold">{u.username as string}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase" style={{ background: rc }}>
                          <i className={`fas ${ri}`} style={{ fontSize: '9px' }}></i> {u.role as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setResetModal(u.id as number); setNewPassword(''); setConfirmPassword(''); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: '#7c3aed' }}>
                          <i className="fas fa-key"></i> Reset
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStatus(u.id as number)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border-none cursor-pointer ${u.status === 'active' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          <i className={`fas fa-${u.status === 'active' ? 'ban' : 'check'}`}></i> {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setResetModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 rounded-t-2xl text-white" style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}>
              <h3 className="font-bold flex items-center gap-2"><i className="fas fa-key"></i> Reset Password</h3>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New Password *</label>
                <input type="text" required minLength={4} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password *</label>
                <input type="text" required minLength={4} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setResetModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#7c3aed' }}>
                  <i className="fas fa-save mr-1"></i> Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
