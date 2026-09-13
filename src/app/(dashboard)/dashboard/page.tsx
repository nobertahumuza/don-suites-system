import db from "@/lib/db";
import TopBar from "@/components/TopBar";

export default async function DashboardPage() {
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
    let r = await db.query("SELECT COUNT(*) as total FROM rooms");
    totalRooms = Number(r.rows[0]?.total ?? 0);

    r = await db.query("SELECT COUNT(*) as total FROM rooms WHERE status = 'available'");
    availableRooms = Number(r.rows[0]?.total ?? 0);

    r = await db.query("SELECT COUNT(*) as total FROM rooms WHERE status = 'occupied'");
    occupiedRooms = Number(r.rows[0]?.total ?? 0);

    r = await db.query("SELECT COUNT(*) as total FROM rooms WHERE status = 'cleaning'");
    cleaningRooms = Number(r.rows[0]?.total ?? 0);

    r = await db.query("SELECT COUNT(*) as total FROM rooms WHERE status = 'out_of_service'");
    outOfServiceRooms = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(*) as total FROM bookings WHERE check_in_date = CURRENT_DATE AND status IN ('confirmed','checked_in')"
    );
    todayCheckins = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(*) as total FROM bookings WHERE check_out_date = CURRENT_DATE AND status = 'checked_in'"
    );
    todayCheckouts = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE type='income' AND transaction_date = CURRENT_DATE"
    );
    todayRevenue = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM financial_transactions WHERE type='income' AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)"
    );
    monthRevenue = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(*) as total FROM bookings WHERE status IN ('confirmed','checked_in')"
    );
    activeBookings = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(*) as total FROM inventory_items WHERE quantity_in_stock <= reorder_level AND status = 'active'"
    );
    lowStock = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(DISTINCT b.id) as total FROM bookings b WHERE b.status = 'checked_in' AND b.check_in_date <= CURRENT_DATE AND b.check_out_date >= CURRENT_DATE"
    );
    activeGuests = Number(r.rows[0]?.total ?? 0);

    r = await db.query(
      "SELECT COUNT(*) as total FROM fb_orders WHERE payment_status = 'unpaid'"
    );
    pendingPayments = Number(r.rows[0]?.total ?? 0);

    try {
      r = await db.query(
        "SELECT COUNT(*) as total FROM fb_orders WHERE DATE(created_at) = CURRENT_DATE"
      );
      todayFbOrders = Number(r.rows[0]?.total ?? 0);
    } catch {
      todayFbOrders = 0;
    }

    try {
      r = await db.query(
        "SELECT COUNT(*) as total FROM security_incidents WHERE status != 'resolved'"
      );
      openIncidents = Number(r.rows[0]?.total ?? 0);
    } catch {
      openIncidents = 0;
    }
  } catch (err: any) {
    console.error('Dashboard query error:', err?.message || err);
  }

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const formatCurrency = (v: number) => {
    if (v >= 1000000) return `UGX ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `UGX ${(v / 1000).toFixed(0)}K`;
    return `UGX ${v.toLocaleString()}`;
  };

  return (
    <>
      <TopBar title="Dashboard" icon="fas fa-tachometer-alt" />

      <div className="py-7 px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fas fa-bed"
            value={totalRooms}
            label="Total Rooms"
            sub={`${availableRooms} available`}
            color="blue"
          />
          <StatCard
            icon="fas fa-check-circle"
            value={occupiedRooms}
            label="Occupied Rooms"
            sub={`${occupancyRate}% occupancy`}
            color="green"
          />
          <StatCard
            icon="fas fa-calendar-check"
            value={activeBookings}
            label="Active Bookings"
            sub={`${todayCheckins} check-ins today`}
            color="orange"
          />
          <StatCard
            icon="fas fa-money-bill-wave"
            value={formatCurrency(todayRevenue)}
            label="Today's Revenue"
            sub={`Month: ${formatCurrency(monthRevenue)}`}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fas fa-sign-out-alt"
            value={todayCheckouts}
            label="Today's Check-outs"
            color="red"
          />
          <StatCard
            icon="fas fa-box"
            value={lowStock}
            label="Low Stock Items"
            color="teal"
          />
          <StatCard
            icon="fas fa-broom"
            value={cleaningRooms}
            label="Being Cleaned"
            color="blue"
          />
          <StatCard
            icon="fas fa-ban"
            value={outOfServiceRooms}
            label="Out of Service"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="fas fa-users"
            value={activeGuests}
            label="Active Guests"
            color="green"
          />
          <StatCard
            icon="fas fa-clock"
            value={pendingPayments}
            label="Pending Payments"
            color="orange"
          />
          <StatCard
            icon="fas fa-receipt"
            value={todayFbOrders}
            label="Today's F&B Orders"
            color="teal"
          />
          <StatCard
            icon="fas fa-exclamation-triangle"
            value={openIncidents}
            label="Open Incidents"
            color="red"
          />
        </div>

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
