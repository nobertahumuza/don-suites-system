'use client';

import { useActionState, useState, useEffect } from 'react';
import { createBooking } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';

export default function BookingForm({
  availableRooms,
  roomTypes,
  preselectedRoom,
}: {
  availableRooms: Array<Record<string, unknown>>;
  roomTypes: Array<Record<string, unknown>>;
  preselectedRoom: number;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [nights, setNights] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (preselectedRoom && availableRooms.length > 0) {
      const room = availableRooms.find((r) => r.id === preselectedRoom);
      if (room) {
        setSelectedPrice(Number(room.price) || 0);
      }
    }
  }, [preselectedRoom, availableRooms]);

  function updateSummary() {
    const checkIn = (document.getElementById('check_in_date') as HTMLInputElement)?.value;
    const checkOut = (document.getElementById('check_out_date') as HTMLInputElement)?.value;
    const roomSelect = document.getElementById('room_id') as HTMLSelectElement;
    const option = roomSelect?.options[roomSelect.selectedIndex];
    const price = parseFloat(option?.dataset.price || '0') || selectedPrice;

    if (checkIn && checkOut && price > 0) {
      const ci = new Date(checkIn);
      const co = new Date(checkOut);
      const diff = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        setNights(diff);
        setSelectedPrice(price);
        setTotalAmount(diff * price);
        return;
      }
    }
    setNights(0);
    setSelectedPrice(0);
    setTotalAmount(0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const data = {
      guest_full_name: (fd.get('guest_full_name') as string) || '',
      guest_phone: (fd.get('guest_phone') as string) || '',
      guest_email: (fd.get('guest_email') as string) || '',
      guest_id_type: (fd.get('guest_id_type') as string) || 'passport',
      guest_id_number: (fd.get('guest_id_number') as string) || '',
      guest_nationality: (fd.get('guest_nationality') as string) || '',
      room_id: parseInt(fd.get('room_id') as string) || 0,
      check_in_date: (fd.get('check_in_date') as string) || '',
      check_out_date: (fd.get('check_out_date') as string) || '',
      amount: totalAmount || parseFloat(fd.get('amount') as string) || 0,
      payment_method: (fd.get('payment_method') as string) || 'cash',
      notes: (fd.get('notes') as string) || '',
    };

    try {
      const result = await createBooking(data);
      router.push('/bookings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200">
          <i className="fas fa-exclamation-circle mr-1"></i> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-user mr-1.5" style={{ color: '#c9a96e' }}></i>
            Guest Information
          </h5>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="guest_full_name"
              required
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Phone *
            </label>
            <input
              type="text"
              name="guest_phone"
              required
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Email
            </label>
            <input
              type="email"
              name="guest_email"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              ID Type
            </label>
            <select
              name="guest_id_type"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            >
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="driving_permit">Driving Permit</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              ID Number
            </label>
            <input
              type="text"
              name="guest_id_number"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            />
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Nationality
            </label>
            <input
              type="text"
              name="guest_nationality"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-bed mr-1.5" style={{ color: '#c9a96e' }}></i>
            Booking Details
          </h5>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Select Room *
            </label>
            <select
              name="room_id"
              id="room_id"
              required
              defaultValue={preselectedRoom || ''}
              onChange={(e) => {
                const opt = e.target.options[e.target.selectedIndex];
                setSelectedPrice(parseFloat(opt.dataset.price || '0'));
                updateSummary();
              }}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            >
              <option value="">-- Select Room --</option>
              {availableRooms.map((room) => (
                <option
                  key={room.id as number}
                  value={room.id as number}
                  data-price={room.price as number}
                >
                  {room.room_number as string} - {room.type_name as string} (UGX {Number(room.price).toLocaleString()}/night)
                </option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                No available rooms. All rooms are currently occupied or reserved.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
                Check-in Date *
              </label>
              <input
                type="date"
                name="check_in_date"
                id="check_in_date"
                min={today}
                required
                onChange={updateSummary}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
                Check-out Date *
              </label>
              <input
                type="date"
                name="check_out_date"
                id="check_out_date"
                min={today}
                required
                onChange={updateSummary}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Payment Method
            </label>
            <select
              name="payment_method"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
            >
              <option value="cash">Cash</option>
              <option value="momo">Mobile Money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#334155' }}>
              Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors resize-none"
            />
          </div>

          {nights > 0 && (
            <div className="p-3 rounded-lg mb-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Nights:</span>
                <span className="font-semibold" style={{ color: '#0f1a3c' }}>{nights}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Rate:</span>
                <span className="font-semibold" style={{ color: '#0f1a3c' }}>
                  UGX {selectedPrice.toLocaleString()}
                </span>
              </div>
              <hr className="my-1.5 border-blue-200" />
              <div className="flex justify-between text-sm">
                <span className="font-bold" style={{ color: '#0f1a3c' }}>Total:</span>
                <span className="font-bold" style={{ color: '#c9a96e' }}>
                  UGX {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || availableRooms.length === 0}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
            style={{ background: '#059669' }}
          >
            {submitting ? (
              'Creating Booking...'
            ) : (
              <>
                <i className="fas fa-check mr-1.5"></i> Create Booking
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
