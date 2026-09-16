import TransferView from './transfer-view';
import { getBookingForTransfer, getAvailableRooms } from '@/lib/actions/booking';

export const metadata = { title: 'Transfer Booking' };

export default async function TransferPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.booking_id ? parseInt(params.booking_id) : 0;

  if (!bookingId) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <i className="fas fa-exchange-alt text-4xl mb-3 block" style={{ color: '#c9a96e', opacity: 0.3 }}></i>
          <h5 className="text-gray-400 font-medium mb-3">No booking selected</h5>
          <a href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
            View Bookings
          </a>
        </div>
      </div>
    );
  }

  try {
    const [booking, rooms] = await Promise.all([
      getBookingForTransfer(bookingId),
      getAvailableRooms(),
    ]);

    return <TransferView booking={booking} availableRooms={rooms} />;
  } catch (err: any) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <i className="fas fa-exclamation-triangle text-4xl mb-3 block" style={{ color: '#ef4444', opacity: 0.3 }}></i>
          <h5 className="text-gray-400 font-medium mb-3">Failed to load booking</h5>
          <p className="text-xs text-gray-400 mb-4">{err.message}</p>
          <a href="/bookings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-redo"></i> Back to Bookings
          </a>
        </div>
      </div>
    );
  }
}
