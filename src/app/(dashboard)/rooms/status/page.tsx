import prisma from '@/lib/db';
import RoomStatusView from './room-status-view';

async function getRoomsWithStatus() {
  const rooms = await prisma.rooms.findMany({
    include: {
      room_types: true,
      bookings: {
        where: { status: { in: ['checked_in', 'confirmed'] } },
        include: { guests: true },
        orderBy: { check_in_date: 'desc' },
        take: 1,
      },
    },
    orderBy: { room_number: 'asc' },
  });

  const stats = await prisma.rooms.groupBy({
    by: ['status'],
    _count: true,
  });

  const statusMap: Record<string, number> = {};
  stats.forEach((s) => {
    statusMap[s.status || 'available'] = s._count;
  });

  return {
    rooms: rooms.map((r) => ({
      id: r.id,
      room_number: r.room_number,
      room_type: r.room_types?.name || 'N/A',
      status: r.status || 'available',
      guest_name: r.bookings?.[0]?.guests?.full_name || null,
      check_out_date: r.bookings?.[0]?.check_out_date
        ? new Date(r.bookings[0].check_out_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : null,
      booking_id: r.bookings?.[0]?.id || null,
    })),
    stats: {
      total: rooms.length,
      available: statusMap['available'] || 0,
      occupied: statusMap['occupied'] || 0,
      cleaning: statusMap['cleaning'] || 0,
      out_of_service: statusMap['out_of_service'] || 0,
      reserved: statusMap['reserved'] || 0,
    },
  };
}

export default async function RoomStatusPage() {
  let data;
  try {
    data = await getRoomsWithStatus();
  } catch {
    data = {
      rooms: [],
      stats: { total: 0, available: 0, occupied: 0, cleaning: 0, out_of_service: 0, reserved: 0 },
    };
  }

  return (
    <RoomStatusView
      rooms={data.rooms}
      stats={data.stats}
    />
  );
}
