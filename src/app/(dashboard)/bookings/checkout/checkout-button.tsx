'use client';

import { processCheckout } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function CheckoutButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ late_fee?: number; late_fee_note?: string; new_total?: number } | null>(null);

  function handleClick() {
    if (!confirm('Confirm check-out? A financial transaction will be recorded.')) return;
    startTransition(async () => {
      try {
        const now = new Date();
        const res = await processCheckout(bookingId, now.toISOString());
        setResult(res);
        if (!res.late_fee || res.late_fee === 0) {
          router.push('/rooms');
        }
      } catch {
        alert('Check-out failed');
      }
    });
  }

  if (result?.late_fee && result.late_fee > 0) {
    return (
      <div className="space-y-3">
        <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e' }}>
          <i className="fas fa-clock mr-1"></i>
          {result.late_fee_note}
          <div className="mt-1 font-bold">New Total: UGX {result.new_total?.toLocaleString()}</div>
        </div>
        <button
          onClick={() => router.push('/rooms')}
          className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200"
          style={{ background: '#f59e0b' }}
        >
          <i className="fas fa-sign-out-alt mr-1.5"></i> Continue to Rooms
        </button>
      </div>
    );
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
