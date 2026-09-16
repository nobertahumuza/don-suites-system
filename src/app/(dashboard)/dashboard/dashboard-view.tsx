'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DashboardStats = {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  outOfServiceRooms: number;
  todayCheckins: number;
  todayCheckouts: number;
  todayRevenue: number;
  monthRevenue: number;
  activeBookings: number;
  lowStock: number;
  activeGuests: number;
  pendingPayments: number;
  todayFbOrders: number;
  openIncidents: number;
};

const datePresets = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

function formatCurrency(v: number) {
  if (v >= 1000000) return `UGX ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `UGX ${(v / 1000).toFixed(0)}K`;
  return `UGX ${v.toLocaleString()}`;
}

export default function DashboardView({ stats }: { stats: DashboardStats }) {
  const router = useRouter();
  const [preset, setPreset] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function handlePresetChange(key: string) {
    setPreset(key);
    if (key !== 'custom') {
      const today = new Date();
      let start = '';
      let end = '';

      if (key === 'today') {
        start = today.toISOString().slice(0, 10);
        end = start;
      } else if (key === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        start = weekStart.toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
      } else if (key === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
      } else if (key === 'year') {
        start = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
      }

      router.push(`/dashboard?start=${start}&end=${end}`);
    }
  }

  function handleCustomApply() {
    if (customStart && customEnd) {
      router.push(`/dashboard?start=${customStart}&end=${customEnd}`);
    }
  }

  const occupancyRate = stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Date Range:</span>
          {datePresets.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetChange(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: preset === p.key ? '#0f1a3c' : '#f1f5f9',
                color: preset === p.key ? '#fff' : '#64748b',
              }}
            >
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
              />
              <button
                onClick={handleCustomApply}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: '#c9a96e' }}
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashCard icon="fas fa-bed" value={stats.totalRooms} label="Total Rooms" sub={`${stats.availableRooms} available`} color="blue" />
        <DashCard icon="fas fa-check-circle" value={stats.occupiedRooms} label="Occupied Rooms" sub={`${occupancyRate}% occupancy`} color="green" />
        <DashCard icon="fas fa-calendar-check" value={stats.activeBookings} label="Active Bookings" sub={`${stats.todayCheckins} check-ins today`} color="orange" />
        <DashCard icon="fas fa-money-bill-wave" value={formatCurrency(stats.todayRevenue)} label="Today's Revenue" sub={`Month: ${formatCurrency(stats.monthRevenue)}`} color="purple" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashCard icon="fas fa-sign-out-alt" value={stats.todayCheckouts} label="Today's Check-outs" color="red" />
        <DashCard icon="fas fa-box" value={stats.lowStock} label="Low Stock Items" color="teal" />
        <DashCard icon="fas fa-broom" value={stats.cleaningRooms} label="Being Cleaned" color="blue" />
        <DashCard icon="fas fa-ban" value={stats.outOfServiceRooms} label="Out of Service" color="purple" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashCard icon="fas fa-users" value={stats.activeGuests} label="Active Guests" color="green" />
        <DashCard icon="fas fa-clock" value={stats.pendingPayments} label="Pending Payments" color="orange" />
        <DashCard icon="fas fa-receipt" value={stats.todayFbOrders} label="Today's F&B Orders" color="teal" />
        <DashCard icon="fas fa-exclamation-triangle" value={stats.openIncidents} label="Open Incidents" color="red" />
      </div>
    </div>
  );
}

function DashCard({ icon, value, label, sub, color }: { icon: string; value: number | string; label: string; sub?: string; color: string }) {
  const borderColors: Record<string, string> = {
    blue: 'border-l-[var(--info)]',
    green: 'border-l-[var(--success)]',
    orange: 'border-l-[var(--warning)]',
    red: 'border-l-[var(--danger)]',
    purple: 'border-l-[var(--purple)]',
    teal: 'border-l-[var(--teal)]',
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-md border-l-4 ${borderColors[color]} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden`}>
      <i className={`${icon} absolute top-4 right-4 text-[32px] opacity-15 text-[var(--text)]`} />
      <h3 className="text-[26px] font-extrabold mb-0.5 tracking-tight text-[var(--text)]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-[0.5px] m-0">{label}</p>
      {sub && <small className="text-xs text-[var(--text-muted)]">{sub}</small>}
    </div>
  );
}
