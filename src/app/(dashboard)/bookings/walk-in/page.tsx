import WalkInView from './walk-in-view';
import { getAvailableRooms } from '@/lib/actions/booking';

export const metadata = { title: 'Walk-in Booking' };

export default async function WalkInPage() {
  let rooms: any[] = [];
  try {
    rooms = await getAvailableRooms();
  } catch {
    rooms = [];
  }

  return <WalkInView availableRooms={rooms} />;
}
