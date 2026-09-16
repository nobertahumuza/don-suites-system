import prisma from '@/lib/db';
import Link from 'next/link';
import CheckoutButton from './checkout-button';
import PartialPaymentForm from './partial-payment-form';

async function getBookingByRoom(roomId: number) {
  return prisma.bookings.findFirst({
    where: {
      status: 'checked_in',
      room_id: roomId,
    },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
    orderBy: { actual_check_in: 'desc' },
  });
}

async function getActiveStays() {
  return prisma.bookings.findMany({
    where: { status: 'checked_in' },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
    orderBy: { actual_check_in: 'asc' },
  });
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ room_id?: string }>;
}) {
  const params = await searchParams;
  const roomId = params.room_id ? parseInt(params.room_id) : 0;

  let booking = null;
  if (roomId > 0) {
    booking = await getBookingByRoom(roomId);
  }

  const activeStays = booking ? [] : await getActiveStays();

  let nights = 0;
  let balance = 0;
  if (booking) {
    const ci = new Date(booking.check_in_date);
    const co = new Date(booking.check_out_date);
    nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
    balance = Number(booking.total_amount) - Number(booking.amount_paid);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-sign-out-alt mr-2" style={{ color: '#c9a96e' }}></i>
          Check-out
        </h4>
        <a
          href="/rooms"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back to Rooms
        </a>
      </div>

      {booking ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-info-circle mr-1.5" style={{ color: '#c9a96e' }}></i>
              Stay Summary
            </h5>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500 w-[40%]">Booking ID</td>
                  <td className="py-2 font-semibold text-gray-900">#{booking.id}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Room</td>
                  <td className="py-2">
                    <span className="font-bold text-gray-900">{booking.rooms?.room_number}</span>
                    <span
                      className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: '#ecfeff', color: '#06b6d4' }}
                    >
                      {booking.rooms?.room_types?.name}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Scheduled Check-in</td>
                  <td className="py-2 text-gray-700">
                    {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Scheduled Check-out</td>
                  <td className="py-2 text-gray-700">
                    {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Actual Check-in</td>
                  <td className="py-2 text-gray-700">
                    {booking.actual_check_in
                      ? new Date(booking.actual_check_in).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : 'N/A'}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Nights</td>
                  <td className="py-2 font-semibold text-gray-900">{nights}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Total Amount</td>
                  <td className="py-2 font-bold" style={{ color: '#0f1a3c' }}>
                    UGX {Number(booking.total_amount).toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Amount Paid</td>
                  <td className="py-2 text-gray-700">
                    UGX {Number(booking.amount_paid).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Balance Due</td>
                  <td className="py-2 font-bold">
                    {balance > 0 ? (
                      <span style={{ color: '#ef4444' }}>UGX {balance.toLocaleString()}</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>Paid in Full</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-5">
            {balance > 0 && <PartialPaymentForm bookingId={booking.id} />}

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-user mr-1.5" style={{ color: '#c9a96e' }}></i>
                Guest Information
              </h5>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500 w-[40%]">Full Name</td>
                    <td className="py-2 font-bold text-gray-900">{booking.guests?.full_name}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">Phone</td>
                    <td className="py-2 text-gray-700">{booking.guests?.phone}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">Email</td>
                    <td className="py-2 text-gray-700">{booking.guests?.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Nationality</td>
                    <td className="py-2 text-gray-700">{booking.guests?.nationality || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h5 className="text-sm font-bold mb-3" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-sign-out-alt mr-1.5" style={{ color: '#f59e0b' }}></i>
                Confirm Check-out
              </h5>
              <p className="text-xs text-gray-500 mb-2">
                Check out <strong>{booking.guests?.full_name}</strong> from Room{' '}
                <strong>{booking.rooms?.room_number}</strong>.
              </p>
              <p className="text-xs text-gray-500 mb-3">
                A financial transaction of{' '}
                <strong>UGX {Number(booking.total_amount).toLocaleString()}</strong> will be recorded as income.
              </p>
              {balance > 0 && (
                <div
                  className="px-3 py-2 rounded-lg text-xs font-medium mb-3"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
                >
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Outstanding Balance: UGX {balance.toLocaleString()}
                </div>
              )}
              <CheckoutButton bookingId={booking.id} />
            </div>
          </div>
        </div>
      ) : activeStays.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h5 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>Active Stays</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">#</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Guest</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Room</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Check-in</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Scheduled Check-out</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeStays.map((stay) => (
                  <tr key={stay.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">#{stay.id}</td>
                    <td className="px-4 py-3 text-gray-700">{stay.guests?.full_name}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{stay.rooms?.room_number}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {stay.actual_check_in
                        ? new Date(stay.actual_check_in).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(stay.check_out_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/checkout?room_id=${stay.room_id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-white"
                        style={{ background: '#f59e0b' }}
                      >
                        <i className="fas fa-sign-out-alt"></i> Check-out
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <i className="fas fa-bed text-4xl mb-3 block" style={{ color: '#c9a96e', opacity: 0.3 }}></i>
          <h5 className="text-gray-400 font-medium mb-3">No active stays</h5>
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#0f1a3c' }}
          >
            View Rooms
          </Link>
        </div>
      )}
    </div>
  );
}
