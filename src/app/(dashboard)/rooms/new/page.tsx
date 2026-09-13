import pool from '@/lib/db';
import { createRoom, updateRoom } from '@/lib/actions/booking';
import { redirect } from 'next/navigation';
import RoomForm from './room-form';

export default async function NewRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const editId = params.edit ? parseInt(params.edit) : 0;

  const { rows: types } = await pool.query('SELECT * FROM room_types ORDER BY name ASC');

  let room = null;
  if (editId > 0) {
    const { rows: rooms } = await pool.query('SELECT * FROM rooms WHERE id = $1', [editId]);
    if (rooms.length === 0) {
      redirect('/rooms');
    }
    room = rooms[0];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-plus-circle mr-2" style={{ color: '#c9a96e' }}></i>
          {editId > 0 ? 'Edit Room' : 'Add New Room'}
        </h4>
        <a
          href="/rooms"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <i className="fas fa-arrow-left text-[10px]"></i> Back
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-[600px]">
        <RoomForm roomTypes={types} room={room} editId={editId} />
      </div>
    </div>
  );
}
