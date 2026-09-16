import prisma from '@/lib/db';
import Link from 'next/link';
import { cancelBooking } from '@/lib/actions/booking';
import BookingActions from './booking-actions';
import Pagination from '@/components/Pagination';

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

async function getBookings(filter: string, page: number, limit: number) {
  const where =
    filter === 'cancelled'
      ? { status: 'cancelled' }
      : filter === 'all'
      ? {}
      : { status: { in: ['pending', 'confirmed', 'checked_in'] } };

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    prisma.bookings.findMany({
      where,
      include: {
        guests: true,
        rooms: { include: { room_types: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.bookings.count({ where }),
  ]);

  return { bookings, total, totalPages: Math.ceil(total / limit) };
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
  searchParams: Promise<{ filter?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'active';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));

  try {
    const { bookings, total, totalPages } = await getBookings(filter, page, limit);

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
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">#{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.guests?.full_name}</div>
                      <div className="text-[11px] text-gray-400">{b.guests?.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{b.rooms?.room_number}</span>
                      <span className="text-[11px] text-gray-400 ml-1">{b.rooms?.room_types?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">
                      {new Date(b.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">
                      {new Date(b.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#0f1a3c' }}>
                      UGX {Number(b.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status || 'pending'} />
                    </td>
                    <td className="px-4 py-3">
                      <BookingActions
                        bookingId={b.id}
                        status={b.status || 'pending'}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <small className="text-xs text-gray-400">Page {page} of {totalPages} ({total} records)</small>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={() => {}} />
        </div>
      </div>
    </div>
  );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <i className="fas fa-exclamation-triangle text-4xl mb-3 block" style={{ color: '#ef4444', opacity: 0.3 }}></i>
        <h5 className="text-gray-400 font-medium mb-3">Failed to load data</h5>
        <p className="text-xs text-gray-400 mb-4">{errorMessage}</p>
        <a href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
          <i className="fas fa-redo"></i> Try Again
        </a>
      </div>
    );
  }
}
