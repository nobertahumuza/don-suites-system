import { getConferenceHalls } from '@/lib/actions/conference';
import NewBookingView from './new-booking-view';

export default async function NewConferenceBookingPage() {
  let halls: any[];
  try {
    halls = await getConferenceHalls();
  } catch {
    halls = [];
  }

  return <NewBookingView halls={halls} />;
}
