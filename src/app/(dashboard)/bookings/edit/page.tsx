import prisma from '@/lib/db';
import EditBookingView from './edit-booking-view';

export default async function EditBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.id ? parseInt(params.id) : 0;

  if (!bookingId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <i className="fas fa-exclamation-triangle text-4xl mb-3 block" style={{ color: '#f59e0b', opacity: 0.3 }}></i>
        <h5 className="text-gray-400 font-medium mb-3">No booking selected</h5>
        <a href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
          Back to Bookings
        </a>
      </div>
    );
  }

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: {
      guests: true,
      rooms: { include: { room_types: true } },
    },
  });

  if (!booking) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <i className="fas fa-times-circle text-4xl mb-3 block" style={{ color: '#ef4444', opacity: 0.3 }}></i>
        <h5 className="text-gray-400 font-medium mb-3">Booking not found</h5>
        <a href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
          Back to Bookings
        </a>
      </div>
    );
  }

  const rooms: any[] = await prisma.rooms.findMany({
    where: { status: { in: ['available', 'reserved'] } },
    include: { room_types: true },
    orderBy: { room_number: 'asc' },
  });

  const serializedBooking = {
    id: booking.id,
    guest_id: booking.guest_id,
    room_id: booking.room_id,
    check_in_date: booking.check_in_date.toISOString().split('T')[0],
    check_out_date: booking.check_out_date.toISOString().split('T')[0],
    nights: booking.nights || 1,
    total_amount: Number(booking.total_amount),
    amount_paid: Number(booking.amount_paid || 0),
    deposit_amount: Number(booking.deposit_amount || 0),
    deposit_paid: Number(booking.deposit_paid || 0),
    status: booking.status || 'pending',
    notes: booking.notes || '',
    guest_name: booking.guests?.full_name || '',
    guest_phone: booking.guests?.phone || '',
    room_number: booking.rooms?.room_number || '',
    room_type_name: booking.rooms?.room_types?.name || '',
    room_price: Number(booking.rooms?.room_types?.price || 0),
  };

  const serializedRooms = rooms.map((r) => ({
    id: r.id,
    room_number: r.room_number,
    status: r.status,
    type_name: r.room_types?.name || '',
    price: Number(r.room_types?.price || 0),
  }));

  return (
    <EditBookingView
      booking={serializedBooking}
      rooms={serializedRooms}
    />
  );
}
