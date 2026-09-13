import pool from '@/lib/db';
import Link from 'next/link';
import { cancelBooking } from '@/lib/actions/booking';
import BookingActions from './booking-actions';

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  checked_in: '#10b981',
  checked_out: '#6b7280',
  cancelled: '#ef4444',
  completed: '#059669',
};

const statusBg: Record<string, string> = {
  pending: '#fffbeb',
  confirmed: '#eff6ff',
  checked_in: '#ecfdf5',
  checked_out: '#f9fafb',
  cancelled: '#fef2f2',
  completed: '#ecfdf5',
};

async function getBookings(filter: string) {
  let query = `SELECT b.*, g.full_name, g.phone, r.room_number, rt.name as type_name
    FROM bookings b
    JOIN guests g ON b.guest_id = g.id
    JOIN rooms r ON b.room_id = r.id
    LEFT JOIN room_types rt ON r.room_type_id = rt.id`;

  if (filter === 'cancelled') {
    query += " WHERE b.status = 'cancelled'";
  } else if (filter === 'all') {
    // no filter
  } else {
    query += " WHERE b.status IN ('pending', 'confirmed', 'checked_in')";
  }

  query += ' ORDER BY b.created_at DESC LIMIT 50';
  const [rows] = await pool.execute(query);
  return rows as Array<Record<string, unknown>>;
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || '#6b7280';
  const bg = statusBg[status] || '#f3f4f6';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: bg, color }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'active';
  const bookings = await getBookings(filter);

  const tabs = [
    { key: 'active', label: 'Active', color: '#0f1a3c' },
    { key: 'all', label: 'All', color: '#7c3aed' },
    { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-calendar-alt mr-2" style={{ color: '#c9a96e' }}></i>
          Manage Bookings
        </h4>
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: '#059669' }}
        >
          <i className="fas fa-plus text-[10px]"></i> New Booking
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/bookings?filter=${tab.key}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === tab.key ? tab.color : '#e2e8f0',
              color: filter === tab.key ? '#fff' : '#475569',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">#</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Guest</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Room</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Check-in</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Check-out</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Total</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Status</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <i className="fas fa-calendar-times text-3xl mb-2 block opacity-30"></i>
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">#{b.id as number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.full_name as string}</div>
                      <div className="text-[11px] text-gray-400">{b.phone as string}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{b.room_number as string}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{b.type_name as string}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">
                      {new Date(b.check_in_date as string).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">
                      {new Date(b.check_out_date as string).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#0f1a3c' }}>
                      UGX {Number(b.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status as string} />
                    </td>
                    <td className="px-4 py-3">
                      <BookingActions
                        bookingId={b.id as number}
                        status={b.status as string}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
