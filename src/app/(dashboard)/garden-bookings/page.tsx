import { getGardenBookings, updateGardenBookingStatus } from '@/lib/actions/garden';
import { revalidatePath } from 'next/cache';
import GardenBookingsView from './garden-bookings-view';

async function handleComplete(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateGardenBookingStatus(bookingId, 'completed');
  revalidatePath('/garden-bookings');
}

async function handleCancel(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateGardenBookingStatus(bookingId, 'cancelled');
  revalidatePath('/garden-bookings');
}

export default async function GardenBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;

  let data;
  try {
    data = await getGardenBookings({ status, date });
  } catch {
    data = { bookings: [], totalBookings: 0, totalRevenue: 0 };
  }

  return (
    <GardenBookingsView
      data={data}
      status={status}
      date={date}
      onHandleComplete={handleComplete}
      onHandleCancel={handleCancel}
    />
  );
}
