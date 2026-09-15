import prisma from '@/lib/db';
import Link from 'next/link';
import { checkIn } from '@/lib/actions/booking';
import CheckinButton from './checkin-button';

async function getBookingByRoom(roomId: number) {
  return prisma.bookings.findFirst({
    where: {
      status: 'confirmed',
      room_id: roomId,
    },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
    orderBy: { check_in_date: 'asc' },
  });
}

async function getPendingCheckins() {
  return prisma.bookings.findMany({
    where: { status: 'confirmed' },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
    orderBy: { check_in_date: 'asc' },
  });
}

export default async function CheckinPage({
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

  const pendingCheckins = booking ? [] : await getPendingCheckins();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-sign-in-alt mr-2" style={{ color: '#c9a96e' }}></i>
          Check-in
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
              Booking Information
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
                  <td className="py-2 text-gray-500">Check-in Date</td>
                  <td className="py-2 text-gray-700">
                    {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Check-out Date</td>
                  <td className="py-2 text-gray-700">
                    {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Nights</td>
                  <td className="py-2 font-semibold text-gray-900">{booking.nights}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Total Amount</td>
                  <td className="py-2 font-bold" style={{ color: '#0f1a3c' }}>
                    UGX {Number(booking.total_amount).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Status</td>
                  <td className="py-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: '#eff6ff', color: '#3b82f6' }}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-5">
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
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">ID Type</td>
                    <td className="py-2 text-gray-700 capitalize">
                      {booking.guests?.id_type?.replace(/_/g, ' ')}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">ID Number</td>
                    <td className="py-2 text-gray-700">{booking.guests?.id_number || 'N/A'}</td>
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
                <i className="fas fa-check-circle mr-1.5" style={{ color: '#10b981' }}></i>
                Confirm Check-in
              </h5>
              <p className="text-xs text-gray-500 mb-4">
                Check in <strong>{booking.guests?.full_name}</strong> to Room{' '}
                <strong>{booking.rooms?.room_number}</strong>.
              </p>
              <CheckinButton bookingId={booking.id} />
            </div>
          </div>
        </div>
      ) : pendingCheckins.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h5 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>Pending Check-ins</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Booking ID</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Guest</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Room</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Check-in Date</th>
                  <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingCheckins.map((pc) => (
                  <tr key={pc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">#{pc.id}</td>
                    <td className="px-4 py-3 text-gray-700">{pc.guests?.full_name}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{pc.rooms?.room_number}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(pc.check_in_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/checkin?room_id=${pc.room_id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-white"
                        style={{ background: '#10b981' }}
                      >
                        <i className="fas fa-sign-in-alt"></i> Check-in
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
          <i className="fas fa-check-circle text-4xl mb-3 block" style={{ color: '#10b981', opacity: 0.3 }}></i>
          <h5 className="text-gray-400 font-medium mb-3">No pending check-ins</h5>
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
