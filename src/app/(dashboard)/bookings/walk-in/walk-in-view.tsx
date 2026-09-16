'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWalkInBooking } from '@/lib/actions/booking';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price: number;
  cooking_space_price: number;
}

export default function WalkInView({ availableRooms }: { availableRooms: Room[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    room_id: '',
    nights: '1',
    payment_method: 'cash',
    amount_paid: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectedRoom = availableRooms.find((r) => r.id === Number(form.room_id));
  const nights = parseInt(form.nights) || 1;
  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;

  function formatCurrency(amount: number) {
    return 'UGX ' + amount.toLocaleString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guest_name.trim()) {
      alert('Guest name is required');
      return;
    }
    if (!form.room_id) {
      alert('Please select a room');
      return;
    }

    setLoading(true);
    try {
      const res = await createWalkInBooking({
        guest_name: form.guest_name.trim(),
        guest_phone: form.guest_phone.trim(),
        room_id: Number(form.room_id),
        nights,
        payment_method: form.payment_method,
        amount_paid: Number(form.amount_paid) || 0,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Booking failed');
    }
    setLoading(false);
  }

  if (result) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#ecfdf5' }}>
            <i className="fas fa-check text-2xl" style={{ color: '#10b981' }}></i>
          </div>
          <h4 className="text-lg font-bold mb-2" style={{ color: '#0f1a3c' }}>Walk-in Booked!</h4>
          <p className="text-sm text-gray-500 mb-4">
            <strong>{result.room_type}</strong> room <strong>{result.room_number}</strong> has been booked successfully.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-left">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Booking #</span>
              <span className="font-bold">#{result.booking_id}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Total</span>
              <span className="font-bold" style={{ color: '#0f1a3c' }}>{formatCurrency(result.total_amount)}</span>
            </div>
            {result.tax_breakdown && (
              <>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(result.tax_breakdown.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Service Charge (10%)</span>
                  <span>{formatCurrency(result.tax_breakdown.service_charge)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT (18%)</span>
                  <span>{formatCurrency(result.tax_breakdown.vat_amount)}</span>
                </div>
              </>
            )}
          </div>
          <div className="px-4 py-3 rounded-lg text-xs font-medium mb-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
            <i className="fas fa-key mr-1"></i>
            Room Key: <strong>{result.room_number}</strong> - Collect from reception
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/bookings')}
              className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#0f1a3c' }}
            >
              View Bookings
            </button>
            <button
              onClick={() => {
                setResult(null);
                setForm({ guest_name: '', guest_phone: '', room_id: '', nights: '1', payment_method: 'cash', amount_paid: '' });
              }}
              className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              New Walk-in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-walking mr-2" style={{ color: '#c9a96e' }}></i>
          Walk-in Booking
        </h4>
        <a
          href="/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back to Bookings
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-user-plus mr-1.5" style={{ color: '#c9a96e' }}></i>
              Guest Information
            </h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  placeholder="Enter guest full name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.guest_phone}
                  onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
                  <i className="fas fa-bed mr-1.5" style={{ color: '#c9a96e' }}></i>
                  Room & Stay
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Select Room *</label>
                    <select
                      required
                      value={form.room_id}
                      onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                    >
                      <option value="">Choose room...</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} - {room.room_type} ({formatCurrency(room.price)}/night)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Nights *</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      required
                      value={form.nights}
                      onChange={(e) => setForm({ ...form, nights: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
                  <i className="fas fa-credit-card mr-1.5" style={{ color: '#c9a96e' }}></i>
                  Payment
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid</label>
                    <input
                      type="number"
                      min="0"
                      value={form.amount_paid}
                      onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || availableRooms.length === 0}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
                style={{ background: '#059669' }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1.5"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle mr-1.5"></i> Book Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-receipt mr-1.5" style={{ color: '#c9a96e' }}></i>
              Booking Summary
            </h5>
            {selectedRoom ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Room</span>
                  <span className="font-bold">{selectedRoom.room_number} - {selectedRoom.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate per night</span>
                  <span className="font-semibold">{formatCurrency(selectedRoom.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nights</span>
                  <span className="font-semibold">{nights}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Charge (10%)</span>
                  <span className="font-semibold">{formatCurrency(Math.round(subtotal * 0.10))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT (18%)</span>
                  <span className="font-semibold">{formatCurrency(Math.round((subtotal + Math.round(subtotal * 0.10)) * 0.18))}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold" style={{ color: '#0f1a3c' }}>Total</span>
                  <span className="font-bold text-sm" style={{ color: '#0f1a3c' }}>
                    {formatCurrency(subtotal + Math.round(subtotal * 0.10) + Math.round((subtotal + Math.round(subtotal * 0.10)) * 0.18))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="fas fa-bed text-2xl mb-2 block opacity-30" style={{ color: '#c9a96e' }}></i>
                <p className="text-xs text-gray-400">Select a room to see summary</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-3" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-info-circle mr-1.5" style={{ color: '#3b82f6' }}></i>
              Quick Info
            </h5>
            <ul className="text-xs text-gray-500 space-y-2">
              <li><i className="fas fa-check mr-1.5" style={{ color: '#10b981' }}></i> Check-in is immediate</li>
              <li><i className="fas fa-check mr-1.5" style={{ color: '#10b981' }}></i> Guest registered automatically</li>
              <li><i className="fas fa-check mr-1.5" style={{ color: '#10b981' }}></i> Collect room key from reception</li>
              <li><i className="fas fa-check mr-1.5" style={{ color: '#10b981' }}></i> Taxes included in total</li>
            </ul>
          </div>

          {availableRooms.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                <i className="fas fa-exclamation-triangle"></i>
                No available rooms for walk-in booking
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
