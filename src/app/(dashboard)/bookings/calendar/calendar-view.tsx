'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Room = {
  id: number;
  room_number: string;
  room_type: string;
  status: string | null;
};

type Booking = {
  id: number;
  room_id: number | null;
  room_number: string;
  guest_name: string;
  check_in_date: string | Date;
  check_out_date: string | Date;
  status: string | null;
  total_amount: number;
};

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  checked_in: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  pending: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  reserved: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  cleaning: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  available: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
};

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function CalendarView({
  rooms,
  bookings,
  startDate,
  endDate,
}: {
  rooms: Room[];
  bookings: Booking[];
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [tooltipBooking, setTooltipBooking] = useState<Booking | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const dates = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      result.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [startDate, endDate]);

  function navigatePeriod(direction: number) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = viewMode === 'weekly' ? 7 : 30;
    start.setDate(start.getDate() + direction * days);
    end.setDate(end.getDate() + direction * days);
    router.push(`/bookings/calendar?start=${formatDate(start)}&end=${formatDate(end)}`);
  }

  function handleCellClick(booking: Booking, e: React.MouseEvent) {
    setTooltipBooking(booking);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }

  function getBookingForRoomAndDate(roomId: number, date: Date) {
    return bookings.find((b) => {
      if (b.room_id !== roomId) return false;
      const ci = new Date(b.check_in_date);
      const co = new Date(b.check_out_date);
      return date >= ci && date <= co;
    });
  }

  function getCellColor(booking?: Booking, roomStatus?: string) {
    if (booking) {
      if (booking.status === 'checked_in') return statusColors.checked_in;
      if (booking.status === 'confirmed') return statusColors.confirmed;
      if (booking.status === 'pending') return statusColors.pending;
      return statusColors.confirmed;
    }
    if (roomStatus === 'cleaning') return statusColors.cleaning;
    if (roomStatus === 'available') return statusColors.available;
    return statusColors.available;
  }

  const today = new Date();

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-calendar-alt" style={{ color: '#c9a96e' }}></i>
              Booking Calendar
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Room occupancy overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'weekly' ? 'text-white' : 'text-white/60 border border-white/20'}`}
              style={viewMode === 'weekly' ? { background: '#c9a96e' } : {}}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'monthly' ? 'text-white' : 'text-white/60 border border-white/20'}`}
              style={viewMode === 'monthly' ? { background: '#c9a96e' } : {}}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigatePeriod(-1)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50"
        >
          <i className="fas fa-chevron-left mr-1"></i> Prev
        </button>
        <span className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
          {new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' - '}
          {new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          onClick={() => navigatePeriod(1)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50"
        >
          Next <i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        {Object.entries(statusColors).slice(0, 4).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: val.bg, border: `1px solid ${val.border}` }}></span>
            <span className="text-[10px] text-gray-500 capitalize">{key.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
              <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 sticky left-0 z-10" style={{ background: '#0f1a3c', minWidth: '100px' }}>
                Room
              </th>
              {dates.map((date) => {
                const isToday = isSameDay(date, today);
                return (
                  <th
                    key={formatDate(date)}
                    className="text-center text-white text-[10px] font-bold uppercase tracking-wider px-2 py-3 min-w-[90px]"
                    style={isToday ? { background: '#c9a96e' } : {}}
                  >
                    <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={dates.length + 1} className="text-center py-10 text-gray-400">
                  <i className="fas fa-bed text-3xl mb-2 block opacity-30"></i>
                  No rooms found
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                  <td className="px-3 py-2 sticky left-0 z-10 border-r border-gray-100" style={{ background: '#fff', minWidth: '100px' }}>
                    <div className="font-bold text-xs" style={{ color: '#0f1a3c' }}>{room.room_number}</div>
                    <div className="text-[10px] text-gray-400">{room.room_type}</div>
                  </td>
                  {dates.map((date) => {
                    const booking = getBookingForRoomAndDate(room.id, date);
                    const cellColor = getCellColor(booking, room.status || 'available');
                    return (
                      <td
                        key={`${room.id}-${formatDate(date)}`}
                        className="px-1 py-1 text-center cursor-pointer transition-all hover:opacity-80"
                        style={{ background: cellColor.bg, borderLeft: `1px solid ${cellColor.border}30` }}
                        onClick={(e) => booking && handleCellClick(booking, e)}
                      >
                        {booking ? (
                          <div className="px-1 py-0.5 rounded text-[9px] font-semibold truncate" style={{ color: cellColor.text }}>
                            {booking.guest_name.split(' ')[0]}
                            <div className="text-[8px] opacity-75">{booking.status === 'checked_in' ? 'IN' : booking.status === 'confirmed' ? 'OK' : 'P'}</div>
                          </div>
                        ) : (
                          <span className="text-[9px] text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tooltipBooking && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[250px]"
          style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
          onClick={() => setTooltipBooking(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>Booking #{tooltipBooking.id}</h4>
            <button onClick={() => setTooltipBooking(null)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Guest:</span>
              <span className="font-semibold text-gray-900">{tooltipBooking.guest_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Room:</span>
              <span className="font-semibold text-gray-900">{tooltipBooking.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-in:</span>
              <span className="text-gray-700">{new Date(tooltipBooking.check_in_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-out:</span>
              <span className="text-gray-700">{new Date(tooltipBooking.check_out_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span
                className="font-semibold px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  background: `${getCellColor(tooltipBooking).bg}`,
                  color: getCellColor(tooltipBooking).text,
                }}
              >
                {tooltipBooking.status}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-100">
              <span className="text-gray-500">Total:</span>
              <span className="font-bold" style={{ color: '#c9a96e' }}>UGX {tooltipBooking.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
