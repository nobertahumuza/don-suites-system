import { getConferenceHallsWithStats } from '@/lib/actions/conference';
import HallsView from './halls-view';

export default async function ConferenceHallsPage() {
  let halls: any[];
  try {
    halls = await getConferenceHallsWithStats();
  } catch {
    halls = [];
  }

  return <HallsView halls={halls} />;
}
