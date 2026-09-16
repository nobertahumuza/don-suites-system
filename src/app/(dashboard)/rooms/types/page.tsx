import { getRoomTypes } from '@/lib/actions/booking';
import TypesView from './types-view';

export default async function RoomTypesPage() {
  let roomTypes: any[];
  try {
    roomTypes = await getRoomTypes();
  } catch {
    roomTypes = [];
  }

  return <TypesView roomTypes={roomTypes} />;
}
