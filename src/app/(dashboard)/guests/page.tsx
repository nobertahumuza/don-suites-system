import { getGuests, getGuestStats } from '@/lib/actions/guests';
import GuestsView from './guests-view';

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const nationality = typeof params.nationality === 'string' ? params.nationality : undefined;

  let guests: any[];
  let stats;
  try {
    [guests, stats] = await Promise.all([
      getGuests({ search, nationality }),
      getGuestStats(),
    ]);
  } catch {
    guests = [];
    stats = { total: 0, male: 0, female: 0, newThisMonth: 0 };
  }

  return <GuestsView guests={guests} stats={stats} search={search} nationality={nationality} />;
}
