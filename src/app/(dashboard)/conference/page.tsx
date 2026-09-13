import { getConferenceBookings, updateConferenceBookingStatus } from '@/lib/actions/conference';
import { revalidatePath } from 'next/cache';
import ConferenceView from './conference-view';

async function handleComplete(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateConferenceBookingStatus(bookingId, 'completed');
  revalidatePath('/conference');
}

async function handleCancel(formData: FormData) {
  'use server';
  const bookingId = Number(formData.get('bookingId'));
  await updateConferenceBookingStatus(bookingId, 'cancelled');
  revalidatePath('/conference');
}

export default async function ConferencePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const date = typeof params.date === 'string' ? params.date : undefined;

  let data;
  try {
    data = await getConferenceBookings({ status, date });
  } catch {
    data = { bookings: [], totalBookings: 0, totalRevenue: 0 };
  }

  return (
    <ConferenceView
      data={data}
      status={status}
      date={date}
      onHandleComplete={handleComplete}
      onHandleCancel={handleCancel}
    />
  );
}
