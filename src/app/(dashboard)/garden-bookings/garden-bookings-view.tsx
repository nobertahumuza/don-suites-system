'use client';

import { useState, useRef } from 'react';
import { createGardenBookingAction } from '@/lib/actions/garden';
import { useRouter } from 'next/navigation';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status || ''] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

type GardenBooking = {
  id: number;
  guest_name: string;
  guest_phone: string | null;
  event_date: string | Date;
  event_type: string | null;
  start_time?: string | Date | null;
  end_time?: string | Date | null;
  purpose: string | null;
  total_amount: number;
  amount_paid: number;
  status: string | null;
  notes: string | null;
  created_by_name: string | null;
  [key: string]: unknown;
};

type GardenData = {
  bookings: GardenBooking[];
  totalBookings: number;
  totalRevenue: number;
};

export default function GardenBookingsView({
  data,
  status,
  date,
  onHandleComplete,
  onHandleCancel,
}: {
  data: GardenData;
  status: string | undefined;
  date: string | undefined;
  onHandleComplete: (formData: FormData) => Promise<void>;
  onHandleCancel: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  function handleConfirm(e: React.FormEvent, message: string) {
    if (!confirm(message)) e.preventDefault();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const guestName = formData.get('guest_name') as string;
    const eventDate = formData.get('event_date') as string;

    if (!guestName) { setError('Guest name is required'); return; }
    if (!eventDate) { setError('Event date is required'); return; }

    setPending(true);
    try {
      await createGardenBookingAction({
        guest_name: guestName,
        guest_phone: formData.get('guest_phone') as string || '',
        event_date: eventDate,
        event_type: formData.get('event_type') as string || '',
        start_time: formData.get('start_time') as string || '',
        end_time: formData.get('end_time') as string || '',
        purpose: formData.get('purpose') as string || '',
        total_amount: parseFloat(formData.get('total_amount') as string) || 0,
        amount_paid: parseFloat(formData.get('amount_paid') as string) || 0,
        notes: formData.get('notes') as string || '',
      });
      form.reset();
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-tree" style={{ color: '#c9a96e' }}></i>
              Garden Bookings
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage outdoor garden event reservations</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#059669' }}
          >
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} text-[10px]`}></i> {showForm ? 'Cancel' : 'New Booking'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-plus-circle mr-1.5" style={{ color: '#c9a96e' }}></i>
            New Garden Booking
          </h3>
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs font-medium mb-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <i className="fas fa-exclamation-circle mr-1"></i> {error}
            </div>
          )}
          <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Guest Name *</label>
              <input type="text" name="guest_name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
              <input type="text" name="guest_phone" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Date *</label>
              <input type="date" name="event_date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Type</label>
              <input type="text" name="event_type" placeholder="e.g. Wedding, Party" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
              <input type="time" name="start_time" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">End Time</label>
              <input type="time" name="end_time" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Purpose</label>
              <input type="text" name="purpose" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Amount (UGX)</label>
              <input type="number" name="total_amount" min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount Paid (UGX)</label>
              <input type="number" name="amount_paid" min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
              <textarea name="notes" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={pending}
                className="px-5 py-2 rounded-lg text-white font-semibold text-sm disabled:opacity-60"
                style={{ background: '#059669' }}
              >
                {pending ? 'Saving...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Revenue</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{data.bookings.filter((b) => b.status === 'confirmed').length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Active Bookings</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 gap-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list" style={{ color: '#c9a96e' }}></i> All Garden Bookings
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
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <i className="fas fa-tree text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No garden bookings found</p>
                  </td>
                </tr>
              ) : (
                data.bookings.map((booking: GardenBooking) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-sm" style={{ color: '#0f1a3c' }}>#{booking.id}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-semibold">{booking.guest_name}</div>
                      {booking.guest_phone && <div className="text-[10px] text-gray-400">{booking.guest_phone}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs">{new Date(booking.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3 text-xs">{String(booking.start_time ?? '').slice(0, 5)} - {String(booking.end_time ?? '').slice(0, 5)}</td>
                    <td className="px-3 py-3 text-xs">{booking.purpose || booking.event_type || 'N/A'}</td>
                    <td className="px-3 py-3 font-bold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(booking.total_amount)}</td>
                    <td className="px-3 py-3 font-bold text-xs" style={{ color: '#10b981' }}>{formatCurrency(booking.amount_paid)}</td>
                    <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                    <td className="px-3 py-3">
                      {booking.status === 'confirmed' && (
                        <div className="flex gap-1">
                          <form action={onHandleComplete}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white" style={{ background: '#10b981' }} title="Mark Completed" onClick={(e) => handleConfirm(e, 'Mark as completed?')}>
                              <i className="fas fa-check"></i>
                            </button>
                          </form>
                          <form action={onHandleCancel}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <button type="submit" className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white" style={{ background: '#ef4444' }} title="Cancel" onClick={(e) => handleConfirm(e, 'Cancel this booking?')}>
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
