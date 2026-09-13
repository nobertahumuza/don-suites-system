'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const statuses = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'out_of_service', label: 'Out of Service' },
];

export default function StatusFilter({ current }: { current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(() => {
      const sp = new URLSearchParams();
      if (value) sp.set('status', value);
      router.push(`/rooms?${sp.toString()}`);
    });
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/30"
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
