import pool from '@/lib/db';
import Link from 'next/link';
import { updateRoomStatus } from '@/lib/actions/booking';
import StatusFilter from './status-filter';

const statusColors: Record<string, string> = {
  available: '#10b981',
  occupied: '#ef4444',
  reserved: '#f59e0b',
  cleaning: '#06b6d4',
  out_of_service: '#8b5cf6',
};

const statusBg: Record<string, string> = {
  available: '#ecfdf5',
  occupied: '#fef2f2',
  reserved: '#fffbeb',
  cleaning: '#ecfeff',
  out_of_service: '#f5f3ff',
};

async function getRooms(statusFilter: string) {
  let query = `SELECT r.*, rt.name AS type_name, rt.price
    FROM rooms r
    LEFT JOIN room_types rt ON r.room_type_id = rt.id`;
  const params: string[] = [];

  if (statusFilter && ['available', 'occupied', 'reserved', 'cleaning', 'out_of_service'].includes(statusFilter)) {
    query += ' WHERE r.status = $1';
    params.push(statusFilter);
  }

  query += ' ORDER BY r.room_number ASC';
  const { rows } = await pool.query(query, params);
  return rows as Array<Record<string, unknown>>;
}

async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) AS total_rooms,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count,
      SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied_count,
      SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved_count,
      SUM(CASE WHEN status = 'cleaning' THEN 1 ELSE 0 END) AS cleaning_count,
      SUM(CASE WHEN status = 'out_of_service' THEN 1 ELSE 0 END) AS out_of_service_count
    FROM rooms
  `);
  return rows[0];
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || '#6b7280';
  const bg = statusBg[status] || '#f3f4f6';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || '';
  const [rooms, stats] = await Promise.all([getRooms(statusFilter), getStats()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-lg font-bold" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-bed mr-2" style={{ color: '#c9a96e' }}></i>
          Room Management
        </h4>
        <div className="flex gap-2">
          <Link
            href="/rooms/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#0f1a3c' }}
          >
            <i className="fas fa-plus text-[10px]"></i> New Room
          </Link>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#059669' }}
          >
            <i className="fas fa-calendar-plus text-[10px]"></i> New Booking
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total_rooms, icon: 'fas fa-bed', color: '#0f1a3c', bg: '#eef2ff' },
          { label: 'Available', value: stats.available_count, icon: 'fas fa-check-circle', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Occupied', value: stats.occupied_count, icon: 'fas fa-bed', color: '#ef4444', bg: '#fef2f2' },
          { label: 'Reserved', value: stats.reserved_count, icon: 'fas fa-bookmark', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Cleaning', value: stats.cleaning_count, icon: 'fas fa-broom', color: '#06b6d4', bg: '#ecfeff' },
          { label: 'Out of Svc', value: stats.out_of_service_count, icon: 'fas fa-ban', color: '#8b5cf6', bg: '#f5f3ff' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 text-center"
            style={{ background: stat.bg }}
          >
            <i className={`${stat.icon} text-lg mb-1`} style={{ color: stat.color }}></i>
            <h3 className="text-xl font-bold" style={{ color: stat.color }}>
              {Number(stat.value) || 0}
            </h3>
            <p className="text-[10px] font-medium" style={{ color: stat.color, opacity: 0.7 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h5 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>Room List</h5>
          <StatusFilter current={statusFilter} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Room #</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Type</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Price/Night</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Status</th>
                <th className="text-left text-white text-[11px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    <i className="fas fa-bed text-3xl mb-2 block opacity-30"></i>
                    No rooms found
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">{room.room_number as string}</td>
                    <td className="px-4 py-3 text-gray-600">{(room.type_name as string) || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#0f1a3c' }}>
                      UGX {Number(room.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={room.status as string} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {room.status === 'available' && (
                          <Link
                            href={`/bookings/new?room_id=${room.id}`}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-white"
                            style={{ background: '#0f1a3c' }}
                          >
                            Book
                          </Link>
                        )}
                        {room.status === 'reserved' && (
                          <Link
                            href={`/bookings/checkin?room_id=${room.id}`}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-white"
                            style={{ background: '#10b981' }}
                          >
                            Check-in
                          </Link>
                        )}
                        {room.status === 'occupied' && (
                          <Link
                            href={`/bookings/checkout?room_id=${room.id}`}
                            className="px-2 py-1 rounded text-[10px] font-semibold text-white"
                            style={{ background: '#f59e0b' }}
                          >
                            Check-out
                          </Link>
                        )}
                        {room.status !== 'available' && room.status !== 'occupied' && (
                          <form action={async () => { 'use server'; await updateRoomStatus(room.id as number, 'available'); }}>
                            <button
                              type="submit"
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-green-300 text-green-600 hover:bg-green-50"
                              title="Mark Available"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          </form>
                        )}
                        {room.status !== 'cleaning' && (
                          <form action={async () => { 'use server'; await updateRoomStatus(room.id as number, 'cleaning'); }}>
                            <button
                              type="submit"
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                              title="Set Cleaning"
                            >
                              <i className="fas fa-broom"></i>
                            </button>
                          </form>
                        )}
                        {room.status !== 'out_of_service' && (
                          <form action={async () => { 'use server'; await updateRoomStatus(room.id as number, 'out_of_service'); }}>
                            <button
                              type="submit"
                              className="px-2 py-1 rounded text-[10px] font-semibold border border-red-300 text-red-600 hover:bg-red-50"
                              title="Out of Service"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
