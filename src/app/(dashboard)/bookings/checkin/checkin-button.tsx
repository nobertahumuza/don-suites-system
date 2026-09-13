'use client';

import { checkIn } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function CheckinButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm('Confirm check-in for this guest?')) return;
    startTransition(async () => {
      try {
        await checkIn(bookingId);
        router.push('/rooms');
      } catch {
        alert('Check-in failed');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
      style={{ background: '#10b981' }}
    >
      {pending ? (
        'Processing...'
      ) : (
        <>
          <i className="fas fa-check-circle mr-1.5"></i> Confirm Check-in
        </>
      )}
    </button>
  );
}
