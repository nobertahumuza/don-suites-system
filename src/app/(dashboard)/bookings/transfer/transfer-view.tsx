'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferBooking } from '@/lib/actions/booking';

interface Booking {
  id: number;
  guest_name: string;
  guest_phone: string;
  room_id: number | null;
  room_number: string;
  room_type: string;
  room_price: number;
  check_in_date: string | Date;
  check_out_date: string | Date;
  actual_check_in: string | Date | null;
  total_amount: number;
  status: string | null;
}

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price: number;
  cooking_space_price: number;
}

export default function TransferView({ booking, availableRooms }: { booking: Booking; availableRooms: Room[] }) {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const priceDiff = selectedRoom ? selectedRoom.price - booking.room_price : 0;

  async function handleTransfer() {
    if (!selectedRoomId) {
      alert('Please select a room');
      return;
    }
    if (!confirm(`Transfer guest from Room ${booking.room_number} to Room ${selectedRoom?.room_number}?`)) return;

    setTransferring(true);
    try {
      const res = await transferBooking(booking.id, selectedRoomId);
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
    setTransferring(false);
  }

  if (result) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#ecfdf5' }}>
            <i className="fas fa-check text-2xl" style={{ color: '#10b981' }}></i>
          </div>
          <h4 className="text-lg font-bold mb-2" style={{ color: '#0f1a3c' }}>Transfer Complete</h4>
          <p className="text-sm text-gray-500 mb-4">
            Guest has been transferred from <strong>Room {result.from_room}</strong> to <strong>Room {result.to_room}</strong>
          </p>
          {result.old_price !== result.new_price && (
            <div className="px-4 py-3 rounded-lg text-xs font-medium mb-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
              <i className="fas fa-info-circle mr-1"></i>
              Rate changed from UGX {result.old_price.toLocaleString()} to UGX {result.new_price.toLocaleString()} per night
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/rooms')}
              className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#0f1a3c' }}
            >
              View Rooms
            </button>
            <button
              onClick={() => router.push('/bookings')}
              className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              Bookings
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
          <i className="fas fa-exchange-alt mr-2" style={{ color: '#c9a96e' }}></i>
          Room Transfer
        </h4>
        <a
          href="/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back to Bookings
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-info-circle mr-1.5" style={{ color: '#c9a96e' }}></i>
            Current Booking
          </h5>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500 w-[40%]">Booking ID</td>
                <td className="py-2 font-semibold text-gray-900">#{booking.id}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Guest</td>
                <td className="py-2 font-bold text-gray-900">{booking.guest_name}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Phone</td>
                <td className="py-2 text-gray-700">{booking.guest_phone || 'N/A'}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Current Room</td>
                <td className="py-2">
                  <span className="font-bold text-gray-900">{booking.room_number}</span>
                  <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: '#ecfeff', color: '#06b6d4' }}>
                    {booking.room_type}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Nightly Rate</td>
                <td className="py-2 font-semibold text-gray-900">UGX {booking.room_price.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Check-in</td>
                <td className="py-2 text-gray-700">
                  {new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Check-out</td>
                <td className="py-2 text-gray-700">
                  {new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Total</td>
                <td className="py-2 font-bold" style={{ color: '#0f1a3c' }}>UGX {booking.total_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-door-open mr-1.5" style={{ color: '#c9a96e' }}></i>
              Select New Room
            </h5>
            {availableRooms.length === 0 ? (
              <div className="text-center py-6">
                <i className="fas fa-bed text-2xl mb-2 block opacity-30" style={{ color: '#c9a96e' }}></i>
                <p className="text-xs text-gray-400">No available rooms</p>
              </div>
            ) : (
              <>
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Choose a room...</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} - {room.room_type} (UGX {room.price.toLocaleString()}/night)
                    </option>
                  ))}
                </select>

                {selectedRoom && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">New Room Rate</span>
                      <span className="font-semibold text-gray-900">UGX {selectedRoom.price.toLocaleString()}/night</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Current Room Rate</span>
                      <span className="font-semibold text-gray-900">UGX {booking.room_price.toLocaleString()}/night</span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-xs">
                      <span className="text-gray-500">Difference</span>
                      <span className={`font-bold ${priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {priceDiff > 0 ? '+' : ''}UGX {priceDiff.toLocaleString()}/night
                      </span>
                    </div>
                    {priceDiff !== 0 && (
                      <div className="mt-2 px-2 py-1.5 rounded text-[10px] font-medium" style={{ background: priceDiff > 0 ? '#fef2f2' : '#ecfdf5', color: priceDiff > 0 ? '#991b1b' : '#065f46' }}>
                        <i className={`fas ${priceDiff > 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                        {priceDiff > 0 ? 'Higher rate - additional charges may apply' : 'Lower rate - credit may apply'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-3" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-exchange-alt mr-1.5" style={{ color: '#f59e0b' }}></i>
              Confirm Transfer
            </h5>
            <p className="text-xs text-gray-500 mb-3">
              Transfer <strong>{booking.guest_name}</strong> from <strong>Room {booking.room_number}</strong> to a new room.
              The old room will be set to &quot;cleaning&quot; status.
            </p>
            <button
              onClick={handleTransfer}
              disabled={transferring || !selectedRoomId}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
              style={{ background: '#f59e0b' }}
            >
              {transferring ? (
                'Processing...'
              ) : (
                <>
                  <i className="fas fa-exchange-alt mr-1.5"></i> Confirm Transfer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
