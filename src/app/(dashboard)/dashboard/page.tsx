import prisma from "@/lib/db";
import TopBar from "@/components/TopBar";
import DashboardView from "./dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  let totalRooms = 0;
  let availableRooms = 0;
  let occupiedRooms = 0;
  let cleaningRooms = 0;
  let outOfServiceRooms = 0;
  let todayCheckins = 0;
  let todayCheckouts = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;
  let activeBookings = 0;
  let lowStock = 0;
  let activeGuests = 0;
  let pendingPayments = 0;
  let todayFbOrders = 0;
  let openIncidents = 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const filterStart = params.start ? new Date(params.start) : today;
    const filterEnd = params.end ? new Date(params.end) : tomorrow;
    if (!params.end) {
      filterEnd.setDate(filterStart.getDate() + 1);
    }

    const [
      totalRoomsR,
      availableRoomsR,
      occupiedRoomsR,
      cleaningRoomsR,
      outOfServiceR,
      todayCheckinsR,
      todayCheckoutsR,
      todayRevenueR,
      monthRevenueR,
      activeBookingsR,
      lowStockR,
      activeGuestsR,
      pendingPaymentsR,
    ] = await Promise.all([
      prisma.rooms.count(),
      prisma.rooms.count({ where: { status: 'available' } }),
      prisma.rooms.count({ where: { status: 'occupied' } }),
      prisma.rooms.count({ where: { status: 'cleaning' } }),
      prisma.rooms.count({ where: { status: 'out_of_service' } }),
      prisma.bookings.count({
        where: {
          check_in_date: { gte: today, lt: tomorrow },
          status: { in: ['confirmed', 'checked_in'] },
        },
      }),
      prisma.bookings.count({
        where: {
          check_out_date: { gte: today, lt: tomorrow },
          status: 'checked_in',
        },
      }),
      prisma.financial_transactions.aggregate({
        _sum: { amount: true },
        where: { type: 'income', transaction_date: { gte: filterStart, lt: filterEnd } },
      }),
      prisma.financial_transactions.aggregate({
        _sum: { amount: true },
        where: {
          type: 'income',
          transaction_date: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.bookings.count({
        where: { status: { in: ['confirmed', 'checked_in'] } },
      }),
      prisma.inventory_items.count({
        where: {
          quantity_in_stock: { lte: prisma.inventory_items.fields.reorder_level },
          status: 'active',
        },
      }).catch(() => 0),
      prisma.bookings.count({
        where: {
          status: 'checked_in',
          check_in_date: { lte: today },
          check_out_date: { gte: today },
        },
      }),
      prisma.fb_orders.count({ where: { payment_status: 'unpaid' } }),
    ]);

    totalRooms = totalRoomsR;
    availableRooms = availableRoomsR;
    occupiedRooms = occupiedRoomsR;
    cleaningRooms = cleaningRoomsR;
    outOfServiceRooms = outOfServiceR;
    todayCheckins = todayCheckinsR;
    todayCheckouts = todayCheckoutsR;
    todayRevenue = Number(todayRevenueR._sum.amount ?? 0);
    monthRevenue = Number(monthRevenueR._sum.amount ?? 0);
    activeBookings = activeBookingsR;
    activeGuests = activeGuestsR;
    pendingPayments = pendingPaymentsR;

    try {
      todayFbOrders = await prisma.fb_orders.count({
        where: {
          created_at: { gte: filterStart, lt: filterEnd },
        },
      });
    } catch {
      todayFbOrders = 0;
    }

    try {
      openIncidents = await prisma.security_incidents.count({
        where: { status: { not: 'resolved' } },
      });
    } catch {
      openIncidents = 0;
    }

    lowStock = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM inventory_items WHERE quantity_in_stock <= reorder_level AND status = 'active'`
    ).then(r => Number(r[0]?.count ?? 0));
  } catch (err: unknown) {
    console.error('Dashboard query error:', (err as Error)?.message || err);
  }

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <>
      <TopBar title="Dashboard" icon="fas fa-tachometer-alt" />

      <div className="py-7 px-8">
        <DashboardView
          stats={{
            totalRooms,
            availableRooms,
            occupiedRooms,
            cleaningRooms,
            outOfServiceRooms,
            todayCheckins,
            todayCheckouts,
            todayRevenue,
            monthRevenue,
            activeBookings,
            lowStock,
            activeGuests,
            pendingPayments,
            todayFbOrders,
            openIncidents,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-[var(--border)]">
            <h5 className="mb-4 text-base font-bold flex items-center gap-2">
              <i className="fas fa-bed text-[var(--primary)]" /> Room Overview
            </h5>
            <div className="space-y-3">
              <OverviewRow label="Available" value={availableRooms} total={totalRooms} color="bg-emerald-500" />
              <OverviewRow label="Occupied" value={occupiedRooms} total={totalRooms} color="bg-amber-500" />
              <OverviewRow label="Cleaning" value={cleaningRooms} total={totalRooms} color="bg-blue-500" />
              <OverviewRow label="Out of Service" value={outOfServiceRooms} total={totalRooms} color="bg-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-[var(--border)]">
            <h5 className="mb-4 text-base font-bold flex items-center gap-2">
              <i className="fas fa-chart-pie text-[var(--accent)]" /> Quick Stats
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <QuickStat icon="fas fa-calendar-plus" label="Today Check-ins" value={todayCheckins} />
              <QuickStat icon="fas fa-calendar-minus" label="Today Check-outs" value={todayCheckouts} />
              <QuickStat icon="fas fa-percentage" label="Occupancy Rate" value={`${occupancyRate}%`} />
              <QuickStat icon="fas fa-boxes" label="Low Stock Items" value={lowStock} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  color,
}: {
  icon: string;
  value: number | string;
  label: string;
  sub?: string;
  color: "blue" | "green" | "orange" | "red" | "purple" | "teal";
}) {
  const borderColors: Record<string, string> = {
    blue: "border-l-[var(--info)]",
    green: "border-l-[var(--success)]",
    orange: "border-l-[var(--warning)]",
    red: "border-l-[var(--danger)]",
    purple: "border-l-[var(--purple)]",
    teal: "border-l-[var(--teal)]",
  };

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-md border-l-4 ${borderColors[color]} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden`}
    >
      <i className={`${icon} absolute top-4 right-4 text-[32px] opacity-15 text-[var(--text)]`} />
      <h3 className="text-[26px] font-extrabold mb-0.5 tracking-tight text-[var(--text)]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </h3>
      <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-[0.5px] m-0">
        {label}
      </p>
      {sub && <small className="text-xs text-[var(--text-muted)]">{sub}</small>}
    </div>
  );
}

function OverviewRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[var(--text-muted)] font-medium">{label}</span>
        <span className="font-bold text-[var(--text)]">
          {value} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
        <i className={`${icon} text-[var(--primary)]`} />
      </div>
      <div>
        <div className="text-lg font-bold text-[var(--text)]">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-[var(--text-muted)] font-medium">{label}</div>
      </div>
    </div>
  );
}
