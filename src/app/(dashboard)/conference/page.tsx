'use server';

import { getConferenceBookings, updateConferenceBookingStatus } from '@/lib/actions/conference';
import { revalidatePath } from 'next/cache';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

async function handleComplete(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateConferenceBookingStatus(bookingId, 'completed');
  revalidatePath('/conference');
}

async function handleCancel(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateConferenceBookingStatus(bookingId, 'cancelled');
  revalidatePath('/conference');
}

export default async function ConferencePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;

  let data;
  try {
    data = await getConferenceBookings({ status, date });
  } catch {
    data = { bookings: [], totalBookings: 0, totalRevenue: 0 };
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-calendar-alt" style={{ color: '#c9a96e' }}></i>
              Conference Bookings
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage conference hall and garden bookings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0f1a3c]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.totalBookings}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Bookings</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{formatCurrency(data.totalRevenue)}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Amount Paid</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.totalBookings}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Filtered Results</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 gap-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list" style={{ color: '#c9a96e' }}></i> All Conference Bookings
          </h3>
          <form className="flex flex-wrap items-end gap-2">
            <div>
              <select name="status" defaultValue={status} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs">
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <input type="date" name="date" defaultValue={date} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs" />
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
              <i className="fas fa-search mr-1"></i> Filter
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">ID</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Guest</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Hall</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Date</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Time</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Purpose</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Total</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Paid</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Status</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400">
                    <i className="fas fa-calendar-alt text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No conference bookings found</p>
                  </td>
                </tr>
              ) : (
                data.bookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-sm" style={{ color: '#0f1a3c' }}>#{booking.id}</span>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold">{booking.guest_name}</td>
                    <td className="px-3 py-3 text-xs">{booking.hall_name} ({booking.hall_type})</td>
                    <td className="px-3 py-3 text-xs">{new Date(booking.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3 text-xs">{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</td>
                    <td className="px-3 py-3 text-xs">{booking.purpose}</td>
                    <td className="px-3 py-3 font-bold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(booking.total_amount)}</td>
                    <td className="px-3 py-3 font-bold text-xs" style={{ color: '#10b981' }}>{formatCurrency(booking.amount_paid)}</td>
                    <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                    <td className="px-3 py-3">
                      {booking.status === 'confirmed' && (
                        <div className="flex gap-1">
                          <form action={handleComplete}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white" style={{ background: '#10b981' }} title="Mark Completed" onClick={(e) => { if (!confirm('Mark as completed?')) e.preventDefault(); }}>
                              <i className="fas fa-check"></i>
                            </button>
                          </form>
                          <form action={handleCancel}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white" style={{ background: '#ef4444' }} title="Cancel" onClick={(e) => { if (!confirm('Cancel this booking?')) e.preventDefault(); }}>
                              <i className="fas fa-times"></i>
                            </button>
                          </form>
                        </div>
                      )}
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
