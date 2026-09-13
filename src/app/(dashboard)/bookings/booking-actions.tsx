'use client';

import { cancelBooking } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function BookingActions({
  bookingId,
  status,
}: {
  bookingId: number;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm('Cancel this booking?')) return;
    startTransition(async () => {
      try {
        await cancelBooking(bookingId);
        router.refresh();
      } catch {
        alert('Failed to cancel booking');
      }
    });
  }

  const canModify = status === 'pending' || status === 'confirmed';

  return (
    <div className="flex gap-1">
      {canModify && (
        <>
          <button
            onClick={handleCancel}
            disabled={pending}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            title="Cancel"
          >
            <i className="fas fa-times"></i>
          </button>
        </>
      )}
      {(status === 'checked_in' || status === 'confirmed') && (
        <button
          onClick={() => window.print()}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white hover:opacity-80 transition-opacity"
          style={{ background: '#1e40af' }}
          title="Receipt"
        >
          <i className="fas fa-print"></i>
        </button>
      )}
    </div>
  );
}
