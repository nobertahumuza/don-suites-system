'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createConferenceBookingAction } from '@/lib/actions/conference';

type Hall = {
  id: number;
  name: string;
  capacity: number | null;
  price_per_day: number;
  type: string | null;
  status: string | null;
};

export default function NewBookingView({ halls }: { halls: Hall[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hall_id: '',
    guest_name: '',
    guest_phone: '',
    event_date: '',
    event_type: '',
    start_time: '',
    end_time: '',
    purpose: '',
    total_amount: '',
    amount_paid: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createConferenceBookingAction({
        hall_id: Number(form.hall_id),
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        event_date: form.event_date,
        event_type: form.event_type,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        total_amount: Number(form.total_amount) || 0,
        amount_paid: Number(form.amount_paid) || 0,
        notes: form.notes,
      });
      router.push('/conference');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Booking failed');
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-calendar-plus" style={{ color: '#c9a96e' }}></i> New Conference Booking
        </h1>
        <button onClick={() => router.back()} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">
          <i className="fas fa-arrow-left mr-1"></i> Back
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-info-circle" style={{ color: '#c9a96e' }}></i> Booking Details
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Conference Hall *</label>
            <select required value={form.hall_id} onChange={(e) => setForm({ ...form, hall_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
              <option value="">Select a hall</option>
              {halls.filter((h) => h.status === 'available').map((h) => (
                <option key={h.id} value={h.id}>{h.name} ({h.type || 'N/A'} - Capacity: {h.capacity || 'N/A'} - UGX {Number(h.price_per_day).toLocaleString()}/day)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Guest Name *</label>
              <input type="text" required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Guest Phone</label>
              <input type="text" value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Event Date *</label>
              <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Event Type</label>
              <input type="text" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="e.g. Conference, Workshop" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Purpose</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose of the event" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Amount (UGX)</label>
              <input type="number" min="0" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid (UGX)</label>
              <input type="number" min="0" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" rows={3} placeholder="Additional notes..."></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
            {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>} Create Booking
          </button>
        </form>
      </div>
    </div>
  );
}
