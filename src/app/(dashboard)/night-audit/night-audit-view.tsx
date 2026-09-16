'use client';

import { useState, useEffect } from 'react';
import { runNightAudit, getNightAuditHistory } from '@/lib/actions/night-audit';

export default function NightAuditView() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await getNightAuditHistory();
      setHistory(data);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadHistory(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const alreadyRunToday = history.some((h) => {
    const d = h.created_at ? new Date(h.created_at).toISOString().split('T')[0] : '';
    return d === today;
  });

  async function handleRun() {
    setShowConfirm(false);
    setRunning(true);
    setLastResult(null);
    try {
      const result = await runNightAudit();
      setLastResult(result);
      await loadHistory();
    } catch (err: any) {
      alert(err.message || 'Night audit failed');
    }
    setRunning(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-moon" style={{ color: '#c9a96e' }}></i>
              Night Audit
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>End-of-day processing and room status updates</p>
          </div>
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10"
          >
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>

      {alreadyRunToday && (
        <div
          className="px-4 py-3 rounded-lg text-xs font-medium mb-6"
          style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <i className="fas fa-exclamation-triangle mr-1.5"></i>
          Night audit has already been run today. Running it again will process any new overdue check-outs.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
            <i className="fas fa-moon text-2xl" style={{ color: '#c9a96e' }}></i>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#0f1a3c' }}>Run Night Audit</h3>
          <p className="text-xs text-gray-500 mb-5 max-w-md mx-auto">
            This will automatically check out all bookings past their scheduled check-out date,
            set those rooms to &quot;cleaning&quot; status, and generate a daily summary report.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={running}
            className="px-8 py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}
          >
            {running ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1.5"></i> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-play mr-1.5"></i> Run Night Audit
              </>
            )}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-exclamation-triangle text-amber-600 text-lg"></i>
              </div>
              <h4 className="text-sm font-bold mb-2" style={{ color: '#0f1a3c' }}>Confirm Night Audit</h4>
              <p className="text-xs text-gray-500 mb-5">
                {alreadyRunToday
                  ? 'This will process any new overdue check-outs since the last audit. Continue?'
                  : 'This will check out all overdue bookings and update room statuses. Continue?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#0f1a3c' }}
                >
                  <i className="fas fa-check mr-1"></i> Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-check-circle mr-1.5" style={{ color: '#10b981' }}></i>
            Audit Complete
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{lastResult.stats.roomsCheckedOut}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Rooms Checked Out</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{lastResult.stats.roomsSetToCleaning}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Set to Cleaning</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-extrabold" style={{ color: '#10b981' }}>UGX {lastResult.stats.revenue.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Revenue Today</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-extrabold" style={{ color: '#0f1a3c' }}>{lastResult.stats.occupancyRate}%</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Occupancy Rate</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: '#0f1a3c' }}>{lastResult.stats.todayCheckIns}</div>
              <div className="text-[10px] text-gray-400">Check-ins Today</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: '#0f1a3c' }}>{lastResult.stats.todayCheckOuts}</div>
              <div className="text-[10px] text-gray-400">Check-outs Today</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: '#0f1a3c' }}>{lastResult.stats.occupiedRooms}/{lastResult.stats.totalRooms}</div>
              <div className="text-[10px] text-gray-400">Rooms Occupied</div>
            </div>
          </div>
          {lastResult.stats.checkedOutRooms.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h6 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Rooms Checked Out</h6>
              <div className="flex flex-wrap gap-1.5">
                {lastResult.stats.checkedOutRooms.map((r: any) => (
                  <span key={r.id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                    <i className="fas fa-door-open text-[8px]"></i> {r.room_number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h5 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-history mr-1.5" style={{ color: '#c9a96e' }}></i>
            Audit History
          </h5>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
        ) : history.length === 0 ? (
          <div className="text-center py-10">
            <i className="fas fa-moon text-3xl mb-3 block opacity-30" style={{ color: '#c9a96e' }}></i>
            <p className="text-sm text-gray-400">No audit runs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  {['#', 'Date & Time', 'Run By', 'Rooms Out', 'Revenue', 'Occupancy'].map((h) => (
                    <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-[11px] text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {h.created_at ? new Date(h.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{h.user_name}</td>
                    <td className="px-4 py-3 text-xs">{h.details?.roomsCheckedOut ?? 0}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#10b981' }}>
                      UGX {(h.details?.revenue ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{h.details?.occupancyRate ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
