import pool from '@/lib/db';
import BookingForm from './booking-form';

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ room_id?: string }>;
}) {
  const params = await searchParams;
  const preselectedRoom = params.room_id ? parseInt(params.room_id) : 0;

  const { rows: types } = await pool.query('SELECT id, name, price, cooking_space_price FROM room_types WHERE status = $1 ORDER BY name ASC', ['active']);

  const typeIds = types.map((t: Record<string, unknown>) => Number(t.id));
  let availableRooms: Array<Record<string, unknown>> = [];
  if (typeIds.length > 0) {
    const placeholders = typeIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: rooms } = await pool.query(
      `SELECT r.*, rt.name AS type_name, rt.price, rt.cooking_space_price
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.status = 'available' AND r.room_type_id IN (${placeholders})
       ORDER BY r.room_number ASC`,
      typeIds
    );
    availableRooms = rooms as Array<Record<string, unknown>>;
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
