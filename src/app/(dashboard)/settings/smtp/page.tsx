'use client';

import { useState, useEffect } from 'react';
import { getEmailSettings, saveEmailSettings } from '@/lib/actions/settings';

export default function SmtpPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try { setSettings(await getEmailSettings()); } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await saveEmailSettings({
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || '587',
        smtp_username: settings.smtp_username || '',
        smtp_password: settings.smtp_password || '',
        smtp_encryption: settings.smtp_encryption || 'tls',
        from_name: settings.from_name || '',
        from_email: settings.from_email || '',
        recipient_email: settings.recipient_email || '',
        director_email: settings.director_email || '',
      });
      setMsg('Email settings saved successfully!');
    } catch (err: any) {
      setMsg(err.message || 'Failed to save settings');
    }
    setSubmitting(false);
  }

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-cog" style={{ color: '#c9a96e' }}></i>
          Email Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Configure SMTP settings to send reports via email</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-server" style={{ color: '#c9a96e' }}></i> SMTP Server Settings
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">SMTP Host</label>
                  <input type="text" value={settings.smtp_host || 'smtp.gmail.com'} onChange={(e) => updateField('smtp_host', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Port</label>
                  <input type="number" value={settings.smtp_port || '587'} onChange={(e) => updateField('smtp_port', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Username (Email)</label>
                  <input type="email" value={settings.smtp_username || ''} onChange={(e) => updateField('smtp_username', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Password (App Password)</label>
                  <input type="password" value={settings.smtp_password || ''} onChange={(e) => updateField('smtp_password', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Enter Gmail App Password" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Encryption</label>
                  <select value={settings.smtp_encryption || 'tls'} onChange={(e) => updateField('smtp_encryption', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="tls">TLS (Recommended)</option>
                    <option value="ssl">SSL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">From Name</label>
                  <input type="text" value={settings.from_name || ''} onChange={(e) => updateField('from_name', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">From Email</label>
                  <input type="email" value={settings.from_email || ''} onChange={(e) => updateField('from_email', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Report Recipient Email</label>
                  <input type="email" value={settings.recipient_email || ''} onChange={(e) => updateField('recipient_email', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Director Email (CC)</label>
                <input type="email" value={settings.director_email || ''} onChange={(e) => updateField('director_email', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Director email address" />
              </div>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Saving...</> : <><i className="fas fa-save mr-1"></i> Save Settings</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-question-circle" style={{ color: '#c9a96e' }}></i> Gmail App Password Guide
              </h3>
            </div>
            <div className="p-5 text-xs text-gray-500 leading-relaxed space-y-2">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">myaccount.google.com</a></li>
                <li>Click <strong>Security</strong> in the left menu</li>
                <li>Enable <strong>2-Step Verification</strong> (required)</li>
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">App Passwords</a></li>
                <li>Select <strong>Mail</strong> and <strong>Windows Computer</strong></li>
                <li>Click <strong>Generate</strong></li>
                <li>Copy the 16-character password</li>
                <li>Paste it in the <strong>Password</strong> field above</li>
              </ol>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mt-4 text-amber-800 text-[11px]">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                <strong>Important:</strong> You must enable 2-Step Verification first, otherwise App Passwords won&apos;t be available.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
