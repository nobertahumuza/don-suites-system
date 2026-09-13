import Link from 'next/link';
import { getFbOrders, getFbStats, markPaid, updateStatus } from '@/lib/actions/fb';
import { revalidatePath } from 'next/cache';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-emerald-100 text-emerald-700',
    served: 'bg-indigo-100 text-indigo-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const icons: Record<string, string> = {
    pending: 'fas fa-clock',
    preparing: 'fas fa-cog',
    ready: 'fas fa-check',
    served: 'fas fa-utensils',
    cancelled: 'fas fa-times',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      <i className={`${icons[status] || 'fas fa-circle'} text-[8px]`}></i>
      {status}
    </span>
  );
}

function OrderTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; icon: string; label: string }> = {
    dine_in: { bg: 'bg-blue-100 text-blue-700', icon: 'fas fa-chair', label: 'Dine In' },
    room_service: { bg: 'bg-amber-100 text-amber-700', icon: 'fas fa-concierge-bell', label: 'Room Svc' },
    takeaway: { bg: 'bg-emerald-100 text-emerald-700', icon: 'fas fa-shopping-bag', label: 'Takeaway' },
  };
  const cfg = styles[type] || styles.dine_in;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${cfg.bg}`}>
      <i className={`${cfg.icon} text-[9px]`}></i>
      {cfg.label}
    </span>
  );
}

async function handleMarkPaid(formData: FormData) {
  'use server';
  const orderId = Number(formData.get('orderId'));
  await markPaid(orderId);
  revalidatePath('/fb/orders');
}

async function handleUpdateStatus(formData: FormData) {
  'use server';
  const orderId = Number(formData.get('orderId'));
  const status = formData.get('status') as string;
  await updateStatus(orderId, status);
  revalidatePath('/fb/orders');
}

export default async function FbOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const date = typeof params.date === 'string' ? params.date : undefined;
  const paymentStatus = typeof params.status === 'string' ? params.status : undefined;
  const fulfillmentStatus = typeof params.fulfillment === 'string' ? params.fulfillment : undefined;
  const orderType = typeof params.type === 'string' ? params.type : undefined;

  const [orders, stats] = await Promise.all([
    getFbOrders({ date, paymentStatus, fulfillmentStatus, orderType }),
    getFbStats(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-concierge-bell" style={{ color: '#c9a96e' }}></i>
              F&B Orders
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage food & beverage orders</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/fb/orders/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <i className="fas fa-plus"></i> New Order
            </Link>
            <Link href="/fb/items" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10">
              <i className="fas fa-boxes"></i> Menu
            </Link>
            <Link href="/fb/categories" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10">
              <i className="fas fa-cog"></i> Categories
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0f1a3c]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>
            <i className="fas fa-receipt"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.totalOrders}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.todayOrders}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Orders</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{formatCurrency(stats.todayRevenue)}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Revenue</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.unpaidCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Unpaid Orders</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Date</label>
            <input type="date" name="date" defaultValue={date} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Payment Status</label>
            <select name="status" defaultValue={paymentStatus} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Order Status</label>
            <select name="fulfillment" defaultValue={fulfillmentStatus} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Order Type</label>
            <select name="type" defaultValue={orderType} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
              <option value="">All Types</option>
              <option value="dine_in">Dine In</option>
              <option value="room_service">Room Service</option>
              <option value="takeaway">Takeaway</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-search mr-1"></i> Filter
          </button>
          <Link href="/fb/orders" className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">
            <i className="fas fa-times mr-1"></i> Clear
          </Link>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">#</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Type</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Guest</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Total</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Payment</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Status</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Date</th>
                <th className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    <i className="fas fa-receipt text-3xl mb-3 block opacity-30"></i>
                    <p className="text-sm">No orders found</p>
                    <Link href="/fb/orders/new" className="text-xs mt-2 inline-block" style={{ color: '#c9a96e' }}>Create first order</Link>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-sm" style={{ color: '#0f1a3c' }}>#{order.id}</span>
                    </td>
                    <td className="px-3 py-3">
                      <OrderTypeBadge type={order.order_type} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-gray-800 text-xs">{order.guest_name || 'Walk-in'}</div>
                      {order.room_number && <div className="text-[10px] text-gray-400">Room {order.room_number}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <PaymentBadge status={order.payment_status} />
                    </td>
                    <td className="px-3 py-3">
                      <FulfillmentBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <Link
                          href={`/receipt?type=fb&id=${order.id}`}
                          target="_blank"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white"
                          style={{ background: '#059669' }}
                          title="Print Receipt"
                        >
                          <i className="fas fa-print"></i>
                        </Link>
                        {order.payment_status !== 'paid' && (
                          <form action={handleMarkPaid}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <button
                              type="submit"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] text-white"
                              style={{ background: '#7c3aed' }}
                              title="Mark Paid"
                              onClick={(e) => {
                                if (!confirm('Mark as paid?')) e.preventDefault();
                              }}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          </form>
                        )}
                      </div>
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
