import { getOccupancyReport, getFinancialSummary, getBookingReport, getStaffReport } from '@/lib/actions/reports';
import ReportsView from './reports-view';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab || 'occupancy';
  const start = params.start || '';
  const end = params.end || '';

  let occupancyData, financialData, bookingData, staffData;

  try {
    if (tab === 'occupancy') occupancyData = await getOccupancyReport();
    else if (tab === 'financial') financialData = await getFinancialSummary(start || undefined, end || undefined);
    else if (tab === 'bookings') bookingData = await getBookingReport();
    else if (tab === 'staff') staffData = await getStaffReport();
  } catch {
    // ignore
  }

  return (
    <ReportsView
      tab={tab}
      start={start}
      end={end}
      occupancyData={occupancyData}
      financialData={financialData}
      bookingData={bookingData}
      staffData={staffData}
    />
  );
}
