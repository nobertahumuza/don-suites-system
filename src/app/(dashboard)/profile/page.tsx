'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/actions/finance';

export default function ProfilePage({ user }: { user?: { id: number; username: string; full_name: string; role: string } }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await updateProfile({
        full_name: fullName,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    }
    setLoading(false);
  }

  const roleColors: Record<string, string> = { admin: '#0f1a3c', reception: '#7c3aed', storekeeper: '#059669', security: '#dc2626' };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#0f1a3c' }}>
        <i className="fas fa-user-circle" style={{ color: '#c9a96e' }}></i> My Profile
      </h1>

      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {message.text}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                {(user?.full_name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>{user?.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold">@{user?.username}</code>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase" style={{ background: roleColors[user?.role || ''] || '#64748b' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Username</label>
              <input type="text" disabled value={user?.username || ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name *</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Role</label>
              <input type="text" disabled value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
            </div>

            <hr className="border-gray-100" />

            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-key" style={{ color: '#c9a96e' }}></i> Change Password
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50" style={{ background: '#0f1a3c' }}>
              {loading ? <><i className="fas fa-spinner fa-spin mr-1"></i> Updating...</> : <><i className="fas fa-save mr-1"></i> Update Profile</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
