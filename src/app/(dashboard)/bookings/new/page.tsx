import prisma from '@/lib/db';
import BookingForm from './booking-form';

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ room_id?: string }>;
}) {
  const params = await searchParams;
  const preselectedRoom = params.room_id ? parseInt(params.room_id) : 0;

  const types = await prisma.room_types.findMany({
    orderBy: { name: 'asc' },
  });

  let availableRooms: Array<Record<string, unknown>> = [];
  if (types.length > 0) {
    const typeIds = types.map((t) => t.id);
    const rooms = await prisma.rooms.findMany({
      where: {
        status: 'available',
        room_type_id: { in: typeIds },
      },
      include: { room_types: true },
      orderBy: { room_number: 'asc' },
    });
    availableRooms = rooms.map((r) => ({
      ...r,
      type_name: r.room_types?.name,
      price: r.room_types?.price,
      cooking_space_price: r.room_types?.cooking_space_price,
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-calendar-plus mr-2" style={{ color: '#c9a96e' }}></i>
          New Booking
        </h4>
        <a
          href="/rooms"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back to Rooms
        </a>
      </div>

      <BookingForm
        availableRooms={availableRooms}
        roomTypes={types}
        preselectedRoom={preselectedRoom}
      />
    </div>
  );
}
