'use client';

import { useState } from 'react';

type Room = {
  id: number;
  room_number: string;
  room_type: string;
  status: string;
  guest_name: string | null;
  check_out_date: string | null;
  booking_id: number | null;
};

type Stats = {
  total: number;
  available: number;
  occupied: number;
  cleaning: number;
  out_of_service: number;
  reserved: number;
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  available: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  occupied: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  cleaning: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  out_of_service: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  reserved: { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' },
};

const statusLabels: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  out_of_service: 'Out of Service',
  reserved: 'Reserved',
};

export default function RoomStatusView({ rooms, stats }: { rooms: Room[]; stats: Stats }) {
  const [filter, setFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const filteredRooms = filter === 'all' ? rooms : rooms.filter((r) => r.status === filter);

  const filters = [
    { key: 'all', label: 'All', count: stats.total, color: '#0f1a3c' },
    { key: 'available', label: 'Available', count: stats.available, color: '#10b981' },
    { key: 'occupied', label: 'Occupied', count: stats.occupied, color: '#f59e0b' },
    { key: 'cleaning', label: 'Cleaning', count: stats.cleaning, color: '#3b82f6' },
    { key: 'out_of_service', label: 'Out of Service', count: stats.out_of_service, color: '#ef4444' },
    { key: 'reserved', label: 'Reserved', count: stats.reserved, color: '#8b5cf6' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-th-large" style={{ color: '#c9a96e' }}></i>
              Room Status Grid
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Real-time room availability</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-xl p-3 text-center transition-all hover:scale-105"
            style={{
              background: filter === f.key ? `${f.color}15` : '#f9fafb',
              border: filter === f.key ? `2px solid ${f.color}` : '2px solid transparent',
            }}
          >
            <h3 className="text-xl font-bold" style={{ color: f.color }}>{f.count}</h3>
            <p className="text-[10px] font-medium" style={{ color: f.color, opacity: 0.7 }}>{f.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-10 text-center">
            <i className="fas fa-bed text-4xl mb-3 block" style={{ color: '#c9a96e', opacity: 0.3 }}></i>
            <h5 className="text-gray-400 font-medium">No rooms found</h5>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const sc = statusColors[room.status] || statusColors.available;
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: sc.border }}></div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-extrabold" style={{ color: '#0f1a3c' }}>{room.room_number}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{room.room_type}</p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.border }}></span>
                    {statusLabels[room.status] || room.status}
                  </span>
                </div>

                {room.guest_name && (
                  <div className="border-t border-gray-50 pt-3 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fas fa-user text-[10px]" style={{ color: '#c9a96e' }}></i>
                      <span className="text-xs font-semibold text-gray-800">{room.guest_name}</span>
                    </div>
                    {room.check_out_date && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-calendar-check text-[10px]" style={{ color: '#c9a96e' }}></i>
                        <span className="text-[11px] text-gray-500">Out: {room.check_out_date}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>Room {selectedRoom.room_number}</h3>
              <button onClick={() => setSelectedRoom(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">Type</span>
                <span className="text-xs font-semibold text-gray-900">{selectedRoom.room_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">Status</span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ background: statusColors[selectedRoom.status]?.bg, color: statusColors[selectedRoom.status]?.text }}
                >
                  {statusLabels[selectedRoom.status]}
                </span>
              </div>
              {selectedRoom.guest_name && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Guest</span>
                    <span className="text-xs font-semibold text-gray-900">{selectedRoom.guest_name}</span>
                  </div>
                  {selectedRoom.check_out_date && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">Check-out Date</span>
                      <span className="text-xs text-gray-700">{selectedRoom.check_out_date}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
