'use client';

import { processCheckIn } from '@/lib/actions/booking';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function CheckinButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ early_fee?: number; early_fee_note?: string; new_total?: number } | null>(null);

  function handleClick() {
    if (!confirm('Confirm check-in for this guest?')) return;
    startTransition(async () => {
      try {
        const now = new Date();
        const res = await processCheckIn(bookingId, now.toISOString());
        setResult(res);
        if (!res.early_fee || res.early_fee === 0) {
          router.push('/rooms');
        }
      } catch {
        alert('Check-in failed');
      }
    });
  }

  if (result?.early_fee && result.early_fee > 0) {
    return (
      <div className="space-y-3">
        <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
          <i className="fas fa-clock mr-1"></i>
          {result.early_fee_note}
          <div className="mt-1 font-bold">New Total: UGX {result.new_total?.toLocaleString()}</div>
        </div>
        <button
          onClick={() => router.push('/rooms')}
          className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200"
          style={{ background: '#10b981' }}
        >
          <i className="fas fa-check-circle mr-1.5"></i> Continue to Rooms
        </button>
      </div>
    );
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
