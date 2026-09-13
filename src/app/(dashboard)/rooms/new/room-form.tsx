'use client';

import { useActionState } from 'react';
import { createRoom, updateRoom } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';

export default function RoomForm({
  roomTypes,
  room,
  editId,
}: {
  roomTypes: Array<Record<string, unknown>>;
  room: Record<string, unknown> | null;
  editId: number;
}) {
  const router = useRouter();

  async function handleSubmit(
    prevState: { error: string } | null,
    formData: FormData
  ): Promise<{ error: string }> {
    const data = {
      room_number: (formData.get('room_number') as string) || '',
      room_type_id: parseInt(formData.get('room_type_id') as string) || 0,
      status: (formData.get('status') as string) || 'available',
    };

    if (!data.room_number) return { error: 'Room number is required' };
    if (!data.room_type_id) return { error: 'Room type is required' };

    try {
      if (editId > 0) {
        await updateRoom({ ...data, room_id: editId });
      } else {
        await createRoom(data);
      }
      router.push('/rooms');
      return { error: '' };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'An error occurred' };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200">
          <i className="fas fa-exclamation-circle mr-1"></i> {state.error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#334155' }}>
          Room Number *
        </label>
        <input
          type="text"
          name="room_number"
          defaultValue={(room?.room_number as string) || ''}
          required
          placeholder="e.g. LR101"
          className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#c9a96e] transition-colors"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#334155' }}>
          Room Type *
        </label>
        <select
          name="room_type_id"
          defaultValue={(room?.room_type_id as string) || ''}
          required
          className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
        >
          <option value="">Select type...</option>
          {roomTypes.map((rt) => (
            <option key={rt.id as number} value={rt.id as number}>
              {rt.name as string} — UGX {Number(rt.price).toLocaleString()}/night
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#334155' }}>
          Status
        </label>
        <select
          name="status"
          defaultValue={(room?.status as string) || 'available'}
          className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-[#c9a96e] transition-colors"
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="cleaning">Cleaning</option>
          <option value="out_of_service">Out of Service</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}
      >
        {isPending ? (
          'Saving...'
        ) : (
          <>
            <i className="fas fa-save mr-1.5"></i>
            {editId > 0 ? 'Update Room' : 'Create Room'}
          </>
        )}
      </button>
    </form>
  );
}
