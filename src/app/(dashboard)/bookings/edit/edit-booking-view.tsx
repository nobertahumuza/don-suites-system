'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateBooking } from '@/lib/actions/booking';

type Booking = {
  id: number;
  guest_id: number | null;
  room_id: number | null;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  total_amount: number;
  amount_paid: number;
  deposit_amount: number;
  deposit_paid: number;
  status: string;
  notes: string;
  guest_name: string;
  guest_phone: string;
  room_number: string;
  room_type_name: string;
  room_price: number;
};

type Room = {
  id: number;
  room_number: string;
  status: string | null;
  type_name: string;
  price: number;
};

export default function EditBookingView({
  booking,
  rooms,
}: {
  booking: Booking;
  rooms: Room[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const isEditable = booking.status === 'pending' || booking.status === 'confirmed';

  const [roomId, setRoomId] = useState(booking.room_id || 0);
  const [checkIn, setCheckIn] = useState(booking.check_in_date);
  const [checkOut, setCheckOut] = useState(booking.check_out_date);
  const [nights, setNights] = useState(booking.nights || 1);
  const [totalAmount, setTotalAmount] = useState(booking.total_amount);
  const [depositAmount, setDepositAmount] = useState(booking.deposit_amount);
  const [notes, setNotes] = useState(booking.notes);

  function calcNights(ci: string, co: string) {
    if (!ci || !co) return 1;
    const d1 = new Date(ci);
    const d2 = new Date(co);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    const n = calcNights(val, checkOut);
    setNights(n);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setTotalAmount(n * room.price);
  }

  function handleCheckOutChange(val: string) {
    setCheckOut(val);
    const n = calcNights(checkIn, val);
    setNights(n);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setTotalAmount(n * room.price);
  }

  function handleRoomChange(val: number) {
    setRoomId(val);
    const room = rooms.find((r) => r.id === val);
    if (room) setTotalAmount(nights * room.price);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!roomId) { setError('Room is required'); return; }
    if (!checkIn) { setError('Check-in date is required'); return; }
    if (!checkOut) { setError('Check-out date is required'); return; }
    if (new Date(checkOut) <= new Date(checkIn)) { setError('Check-out must be after check-in'); return; }

    startTransition(async () => {
      try {
        await updateBooking(booking.id, {
          room_id: roomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          nights,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          notes,
        });
        router.push('/bookings');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update booking');
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-edit mr-2" style={{ color: '#c9a96e' }}></i>
          Edit Booking #{booking.id}
        </h4>
        <a
          href="/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back to Bookings
        </a>
      </div>

      {!isEditable && (
        <div className="px-4 py-3 rounded-lg text-xs font-medium mb-4" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <i className="fas fa-exclamation-triangle mr-1"></i>
          This booking cannot be edited (status: {booking.status.replace(/_/g, ' ')})
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg text-xs font-medium mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <i className="fas fa-exclamation-circle mr-1"></i> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-bed mr-1.5" style={{ color: '#c9a96e' }}></i>
              Room & Dates
            </h5>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Room</label>
                <select
                  value={roomId}
                  onChange={(e) => handleRoomChange(Number(e.target.value))}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value={0}>Select room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} - {r.type_name} (UGX {r.price.toLocaleString()}/night)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Nights</label>
                <input
                  type="number"
                  value={nights}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-money-bill-wave mr-1.5" style={{ color: '#c9a96e' }}></i>
              Payment Details
            </h5>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Amount (UGX)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Deposit Amount (UGX)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-500">Amount Paid</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: '#10b981' }}>UGX {booking.amount_paid.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-gray-500">Balance</td>
                      <td className="py-1.5 text-right font-bold" style={{ color: totalAmount - booking.amount_paid > 0 ? '#ef4444' : '#10b981' }}>
                        UGX {(totalAmount - booking.amount_paid).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditable}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !isEditable}
            className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60"
            style={{ background: '#0f1a3c' }}
          >
            {pending ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/bookings"
            className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
