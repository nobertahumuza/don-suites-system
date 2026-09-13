'use client';

import { checkOut } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function CheckoutButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm('Confirm check-out? A financial transaction will be recorded.')) return;
    startTransition(async () => {
      try {
        await checkOut(bookingId);
        router.push('/rooms');
      } catch {
        alert('Check-out failed');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60"
      style={{ background: '#f59e0b' }}
    >
      {pending ? (
        'Processing...'
      ) : (
        <>
          <i className="fas fa-sign-out-alt mr-1.5"></i> Confirm Check-out
        </>
      )}
    </button>
  );
}
