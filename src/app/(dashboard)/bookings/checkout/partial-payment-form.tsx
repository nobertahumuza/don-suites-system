'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { recordPartialPayment } from '@/lib/actions/booking';

export default function PartialPaymentForm({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }

    startTransition(async () => {
      try {
        await recordPartialPayment(bookingId, {
          amount: amt,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
        });
        setSuccess('Payment recorded successfully');
        setAmount('');
        setReferenceNumber('');
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to record payment');
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h5 className="text-sm font-bold mb-4" style={{ color: '#0f1a3c' }}>
        <i className="fas fa-hand-holding-usd mr-1.5" style={{ color: '#c9a96e' }}></i>
        Record Payment
      </h5>

      {error && (
        <div className="px-3 py-2 rounded-lg text-xs font-medium mb-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <i className="fas fa-exclamation-circle mr-1"></i> {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2 rounded-lg text-xs font-medium mb-3" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}>
          <i className="fas fa-check-circle mr-1"></i> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount (UGX)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Reference Number</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Optional reference"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: '#10b981' }}
        >
          {pending ? 'Recording...' : (
            <>
              <i className="fas fa-plus mr-1.5"></i> Record Payment
            </>
          )}
        </button>
      </form>
    </div>
  );
}
