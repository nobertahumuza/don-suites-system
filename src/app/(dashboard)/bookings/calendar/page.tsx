import { getBookingsForCalendar } from '@/lib/actions/calendar';
import CalendarView from './calendar-view';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDate = params.start || weekStart.toISOString().slice(0, 10);
  const endDate = params.end || weekEnd.toISOString().slice(0, 10);

  let data;
  try {
    data = await getBookingsForCalendar(startDate, endDate);
  } catch {
    data = { rooms: [], bookings: [] };
  }

  return (
    <CalendarView
      rooms={data.rooms}
      bookings={data.bookings}
      startDate={startDate}
      endDate={endDate}
    />
  );
}
