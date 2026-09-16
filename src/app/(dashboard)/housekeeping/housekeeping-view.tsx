'use client';

import { useState } from 'react';
import { completeHousekeeping, assignHousekeeping } from '@/lib/actions/housekeeping';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price: number;
  status: string;
}

interface Stats {
  pending: number;
  available: number;
  occupied: number;
  reserved: number;
  out_of_service: number;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  cleaning: { label: 'Cleaning', color: '#f59e0b', bg: '#fffbeb' },
  available: { label: 'Available', color: '#10b981', bg: '#ecfdf5' },
  occupied: { label: 'Occupied', color: '#3b82f6', bg: '#eff6ff' },
  reserved: { label: 'Reserved', color: '#8b5cf6', bg: '#f5f3ff' },
  out_of_service: { label: 'Out of Service', color: '#ef4444', bg: '#fef2f2' },
};

export default function HousekeepingView({ tasks, stats }: { tasks: Room[]; stats: Stats }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const filteredTasks = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  async function handleComplete(roomId: number) {
    if (!confirm('Mark this room as cleaned and available?')) return;
    setLoading(true);
    try {
      await completeHousekeeping(roomId);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
    setLoading(false);
  }

  async function handleAssign(roomId: number, status: string) {
    setLoading(true);
    try {
      await assignHousekeeping(roomId, status);
      setShowAssignModal(false);
      setSelectedRoom(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
    setLoading(false);
  }

  function openAssignModal(room: Room) {
    setSelectedRoom(room);
    setShowAssignModal(true);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-broom" style={{ color: '#c9a96e' }}></i> Housekeeping
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Needs Cleaning', value: stats.pending, icon: 'fas fa-broom', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Available', value: stats.available, icon: 'fas fa-check-circle', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Occupied', value: stats.occupied, icon: 'fas fa-bed', color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Total Rooms', value: stats.total, icon: 'fas fa-door-open', color: '#0f1a3c', bg: '#eef2ff' },
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
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="cleaning">Needs Cleaning</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
          <button
            onClick={() => setStatusFilter('')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                {['Room #', 'Type', 'Status', 'Rate/Night', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-white text-[10px] font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    <i className="fas fa-broom text-3xl mb-2 block opacity-30" style={{ color: '#c9a96e' }}></i>
                    No rooms found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((room) => {
                  const sc = statusConfig[room.status] || statusConfig.available;
                  return (
                    <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold" style={{ color: '#0f1a3c' }}>{room.room_number}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{room.room_type}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#0f1a3c' }}>
                        UGX {room.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {room.status === 'cleaning' && (
                            <button
                              onClick={() => handleComplete(room.id)}
                              disabled={loading}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-white disabled:opacity-60"
                              style={{ background: '#10b981' }}
                            >
                              <i className="fas fa-check mr-1"></i> Complete
                            </button>
                          )}
                          {room.status !== 'cleaning' && room.status !== 'occupied' && (
                            <button
                              onClick={() => openAssignModal(room)}
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              <i className="fas fa-edit mr-1"></i> Update
                            </button>
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

      {showAssignModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-broom" style={{ color: '#c9a96e' }}></i>
                Room {selectedRoom.room_number}
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 mb-3">Update status for Room {selectedRoom.room_number} ({selectedRoom.room_type})</p>
              {[
                { status: 'cleaning', label: 'Mark as Cleaning', icon: 'fas fa-broom', color: '#f59e0b' },
                { status: 'available', label: 'Mark as Available', icon: 'fas fa-check-circle', color: '#10b981' },
                { status: 'out_of_service', label: 'Mark Out of Service', icon: 'fas fa-ban', color: '#ef4444' },
              ].map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => handleAssign(selectedRoom.id, opt.status)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-60"
                >
                  <i className={opt.icon} style={{ color: opt.color }}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
