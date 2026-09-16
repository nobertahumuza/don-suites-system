'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { exportReportToCSV, printReport } from '@/lib/actions/export';

type OccupancyData = {
  summary: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    reservedRooms: number;
    cleaningRooms: number;
    outOfServiceRooms: number;
    currentOccupancy: number;
    historicalOccupancy: number;
  };
  byType: Array<{ name: string; total: number; occupied: number; available: number; price: number }>;
};

type FinancialData = {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    transactionCount: number;
  };
  incomeByCategory: Array<{ category: string; amount: number }>;
  expenseByCategory: Array<{ category: string; amount: number }>;
  recentTransactions: Array<{ id: number; type: string; category: string; description: string; amount: number; payment_method?: string | null; transaction_date: string }>;
};

type BookingData = {
  summary: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    totalCollected: number;
    outstandingBalance: number;
    averageBookingValue: number;
    averageStay: number;
  };
  monthlyTrend: Array<{ month: string; count: number; revenue: number }>;
};

type StaffData = {
  summary: { totalStaff: number; activeStaff: number; inactiveStaff: number };
  byDepartment: Array<{ department: string; count: number }>;
  leaveStats: Array<{ status: string; count: number }>;
  recentLeave: Array<{ id: number; staff_name: string; department: string; leave_type: string; start_date: string; end_date: string; days?: number | null; status?: string | null }>;
};

function fmt(amount: number) {
  return 'UGX ' + amount.toLocaleString();
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: color }}></div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: `${color}15`, color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="text-xl font-extrabold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function OccupancyTab({ data }: { data: OccupancyData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={data.summary.totalRooms} color="#0f1a3c" icon="fa-bed" />
        <StatCard label="Occupied" value={data.summary.occupiedRooms} color="#10b981" icon="fa-user" />
        <StatCard label="Available" value={data.summary.availableRooms} color="#3b82f6" icon="fa-check" />
        <StatCard label="Occupancy Rate" value={`${data.summary.currentOccupancy}%`} color="#c9a96e" icon="fa-chart-line" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Reserved" value={data.summary.reservedRooms} color="#f59e0b" icon="fa-calendar" />
        <StatCard label="Cleaning" value={data.summary.cleaningRooms} color="#8b5cf6" icon="fa-broom" />
        <StatCard label="Out of Service" value={data.summary.outOfServiceRooms} color="#ef4444" icon="fa-ban" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-layer-group mr-1.5" style={{ color: '#c9a96e' }}></i> Room Type Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Occupied</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Available</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Price/Night</th>
              </tr>
            </thead>
            <tbody>
              {data.byType.map((rt) => (
                <tr key={rt.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{rt.name}</td>
                  <td className="px-4 py-3 text-gray-700">{rt.total}</td>
                  <td className="px-4 py-3 text-gray-700">{rt.occupied}</td>
                  <td className="px-4 py-3 text-gray-700">{rt.available}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#0f1a3c' }}>{fmt(rt.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ data }: { data: FinancialData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={fmt(data.summary.totalIncome)} color="#10b981" icon="fa-arrow-up" />
        <StatCard label="Total Expenses" value={fmt(data.summary.totalExpense)} color="#ef4444" icon="fa-arrow-down" />
        <StatCard label="Net Income" value={fmt(data.summary.netIncome)} color="#0f1a3c" icon="fa-balance-scale" />
        <StatCard label="Transactions" value={data.summary.transactionCount} color="#c9a96e" icon="fa-receipt" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-arrow-up mr-1.5" style={{ color: '#10b981' }}></i> Income by Category
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.incomeByCategory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No income records</p>
            ) : (
              data.incomeByCategory.map((c) => (
                <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-600 capitalize">{c.category}</span>
                  <span className="text-xs font-bold" style={{ color: '#10b981' }}>{fmt(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-arrow-down mr-1.5" style={{ color: '#ef4444' }}></i> Expenses by Category
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.expenseByCategory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No expense records</p>
            ) : (
              data.expenseByCategory.map((c) => (
                <div key={c.category} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-600 capitalize">{c.category}</span>
                  <span className="text-xs font-bold" style={{ color: '#ef4444' }}>{fmt(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list mr-1.5" style={{ color: '#c9a96e' }}></i> Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Category</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Description</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No transactions found</td></tr>
              ) : (
                data.recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-600">{t.transaction_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{t.category}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">{t.description}</td>
                    <td className="px-4 py-3 font-bold text-xs" style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{t.payment_method}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BookingsTab({ data }: { data: BookingData }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={data.summary.totalBookings} color="#0f1a3c" icon="fa-calendar-alt" />
        <StatCard label="Active" value={data.summary.activeBookings} color="#3b82f6" icon="fa-clock" />
        <StatCard label="Completed" value={data.summary.completedBookings} color="#10b981" icon="fa-check-circle" />
        <StatCard label="Cancelled" value={data.summary.cancelledBookings} color="#ef4444" icon="fa-times-circle" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={fmt(data.summary.totalRevenue)} color="#c9a96e" icon="fa-money-bill" />
        <StatCard label="Collected" value={fmt(data.summary.totalCollected)} color="#10b981" icon="fa-hand-holding-usd" />
        <StatCard label="Outstanding" value={fmt(data.summary.outstandingBalance)} color="#ef4444" icon="fa-exclamation-triangle" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Avg Booking Value" value={fmt(data.summary.averageBookingValue)} color="#8b5cf6" icon="fa-chart-bar" />
        <StatCard label="Avg Stay (nights)" value={data.summary.averageStay} color="#06b6d4" icon="fa-moon" />
      </div>
      {data.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-chart-line mr-1.5" style={{ color: '#c9a96e' }}></i> Monthly Trend
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                  <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Month</th>
                  <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Bookings</th>
                  <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyTrend.map((m) => (
                  <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{m.count}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: '#0f1a3c' }}>{fmt(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffTab({ data }: { data: StaffData }) {
  const leaveStatusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Staff" value={data.summary.totalStaff} color="#0f1a3c" icon="fa-users" />
        <StatCard label="Active" value={data.summary.activeStaff} color="#10b981" icon="fa-user-check" />
        <StatCard label="Inactive" value={data.summary.inactiveStaff} color="#ef4444" icon="fa-user-slash" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-building mr-1.5" style={{ color: '#c9a96e' }}></i> By Department
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.byDepartment.map((d) => (
              <div key={d.department} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600">{d.department}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-umbrella-beach mr-1.5" style={{ color: '#c9a96e' }}></i> Leave Statistics
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.leaveStats.map((l) => (
              <div key={l.status} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600 capitalize">{l.status}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${leaveStatusColors[l.status] || '#6b7280'}15`, color: leaveStatusColors[l.status] || '#6b7280' }}>{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-list mr-1.5" style={{ color: '#c9a96e' }}></i> Recent Leave Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Staff</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Department</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">From</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">To</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Days</th>
                <th className="text-left text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeave.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-xs">No leave requests</td></tr>
              ) : (
                data.recentLeave.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">{l.staff_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.department}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{l.leave_type}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.start_date}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.end_date}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{l.days}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full capitalize" style={{ background: `${leaveStatusColors[l.status || ''] || '#6b7280'}15`, color: leaveStatusColors[l.status || ''] || '#6b7280' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportsView({
  tab,
  start,
  end,
  occupancyData,
  financialData,
  bookingData,
  staffData,
}: {
  tab: string;
  start: string;
  end: string;
  occupancyData?: OccupancyData;
  financialData?: FinancialData;
  bookingData?: BookingData;
  staffData?: StaffData;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(tab);

  const tabs = [
    { key: 'occupancy', label: 'Occupancy', icon: 'fa-bed', color: '#0f1a3c' },
    { key: 'financial', label: 'Financial', icon: 'fa-chart-pie', color: '#10b981' },
    { key: 'bookings', label: 'Bookings', icon: 'fa-calendar', color: '#3b82f6' },
    { key: 'staff', label: 'Staff', icon: 'fa-users', color: '#8b5cf6' },
  ];

  function handleTabChange(key: string) {
    setActiveTab(key);
    router.push(`/reports?tab=${key}`);
  }

  function handleExportCSV() {
    let data: Record<string, unknown>[] = [];
    if (activeTab === 'occupancy' && occupancyData) {
      data = occupancyData.byType.map((t) => ({
        Type: t.name,
        Total: t.total,
        Occupied: t.occupied,
        Available: t.available,
        Price: t.price,
      }));
    } else if (activeTab === 'financial' && financialData) {
      data = financialData.recentTransactions.map((t) => ({
        Date: t.transaction_date,
        Type: t.type,
        Category: t.category,
        Description: t.description,
        Amount: t.amount,
        Method: t.payment_method,
      }));
    } else if (activeTab === 'bookings' && bookingData) {
      data = bookingData.monthlyTrend.map((m) => ({
        Month: m.month,
        Bookings: m.count,
        Revenue: m.revenue,
      }));
    } else if (activeTab === 'staff' && staffData) {
      data = staffData.recentLeave.map((l) => ({
        Staff: l.staff_name,
        Department: l.department,
        Type: l.leave_type,
        Start: l.start_date,
        End: l.end_date,
        Days: l.days,
        Status: l.status,
      }));
    }
    if (data.length > 0) {
      exportReportToCSV(data, `report_${activeTab}`);
    }
  }

  return (
    <div>
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-chart-bar" style={{ color: '#c9a96e' }}></i>
              Reports Center
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Analytics and insights across all operations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#c9a96e' }}
            >
              <i className="fas fa-download text-[10px]"></i> Export CSV
            </button>
            <button
              onClick={() => printReport()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#0f1a3c' }}
            >
              <i className="fas fa-print text-[10px]"></i> Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              background: activeTab === t.key ? t.color : '#e2e8f0',
              color: activeTab === t.key ? '#fff' : '#475569',
            }}
          >
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'financial' && (
        <form className="flex items-end gap-2 mb-5">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">From</label>
            <input type="date" name="start" defaultValue={start} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">To</label>
            <input type="date" name="end" defaultValue={end} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs" />
          </div>
          <input type="hidden" name="tab" value={activeTab} />
          <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-filter mr-1"></i> Apply
          </button>
        </form>
      )}

      {activeTab === 'occupancy' && occupancyData && <OccupancyTab data={occupancyData} />}
      {activeTab === 'financial' && financialData && <FinancialTab data={financialData} />}
      {activeTab === 'bookings' && bookingData && <BookingsTab data={bookingData} />}
      {activeTab === 'staff' && staffData && <StaffTab data={staffData} />}
    </div>
  );
}
