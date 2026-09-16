import HousekeepingView from './housekeeping-view';
import { getHousekeepingTasks, getHousekeepingStats } from '@/lib/actions/housekeeping';

export const metadata = { title: 'Housekeeping' };

export default async function HousekeepingPage() {
  let tasks: any[];
  let stats;
  try {
    [tasks, stats] = await Promise.all([
      getHousekeepingTasks(),
      getHousekeepingStats(),
    ]);
  } catch {
    tasks = [];
    stats = { pending: 0, available: 0, occupied: 0, reserved: 0, out_of_service: 0, total: 0 };
  }

  return <HousekeepingView tasks={tasks} stats={stats} />;
}
