'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getFrontDeskStats,
  getActiveVisitors,
  getRecentFbOrders,
  getOrderItems,
  logVisitor,
  checkOutVisitor,
} from '@/lib/actions/visitor';
import { createOrder, markPaid, getFbItems } from '@/lib/actions/fb';
import Link from 'next/link';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatCard({ icon, value, label, color, bg }: { icon: string; value: string | number; label: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: color }}></div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: bg, color }}>
        <i className={icon}></i>
      </div>
      <div className="text-xl font-extrabold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

const wantsOptions = [
  { icon: 'fas fa-bed', label: 'Book a Room', value: 'Book a Room' },
  { icon: 'fas fa-key', label: 'Check In', value: 'Check In' },
  { icon: 'fas fa-sign-out-alt', label: 'Check Out', value: 'Check Out' },
  { icon: 'fas fa-user-friends', label: 'Visit a Guest', value: 'Visit a Guest' },
  { icon: 'fas fa-utensils', label: 'Food / Restaurant', value: 'Food / Restaurant' },
  { icon: 'fas fa-box', label: 'Make a Delivery', value: 'Make a Delivery' },
  { icon: 'fas fa-handshake', label: 'Business Meeting', value: 'Business Meeting' },
  { icon: 'fas fa-concierge-bell', label: 'Conference / Event', value: 'Conference / Event' },
  { icon: 'fas fa-car', label: 'Parking', value: 'Parking' },
  { icon: 'fas fa-question-circle', label: 'General Inquiry', value: 'General Inquiry' },
];

export default function FrontDeskPage() {
  const [stats, setStats] = useState<any>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [fbOrders, setFbOrders] = useState<any[]>([]);
  const [fbItems, setFbItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [selectedWants, setSelectedWants] = useState('');

  const [logForm, setLogForm] = useState({ personType: 'guest', name: '', phone: '', wants: '', visitingRoom: '', vehicleNumber: '', purpose: '' });
  const [quickOrder, setQuickOrder] = useState({ guestName: '', orderType: 'dine_in', roomNumber: '', items: {} as Record<number, number> });
  const [logError, setLogError] = useState('');
  const [logSuccess, setLogSuccess] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      getFrontDeskStats(),
      getActiveVisitors(),
      getRecentFbOrders(15),
      getFbItems(),
    ]).then(([s, v, o, i]) => {
      setStats(s);
      setVisitors(v as any[]);
      setFbOrders(o as any[]);
      setFbItems(i as any[]);
      setLoading(false);
    });
  }, []);

  async function refreshData() {
    const [s, v, o] = await Promise.all([getFrontDeskStats(), getActiveVisitors(), getRecentFbOrders(15)]);
    setStats(s);
    setVisitors(v as any[]);
    setFbOrders(o as any[]);
  }

  function handleLogSubmit() {
    setLogError('');
    setLogSuccess('');
    if (!logForm.name.trim() || !selectedWants) {
      setLogError('Name and purpose are required');
      return;
    }
    startTransition(async () => {
      await logVisitor({
        visitorName: logForm.name,
        visitorPhone: logForm.phone,
        purpose: selectedWants,
        visitingGuest: logForm.visitingRoom,
        roomNumber: logForm.visitingRoom,
        vehicleNumber: logForm.vehicleNumber,
      });
      setLogSuccess('Person logged successfully');
      setLogForm({ personType: 'guest', name: '', phone: '', wants: '', visitingRoom: '', vehicleNumber: '', purpose: '' });
      setSelectedWants('');
      await refreshData();
      setTimeout(() => { setShowLogModal(false); setLogSuccess(''); }, 1500);
    });
  }

  function handleCheckout(id: number) {
    if (!confirm('Check out this visitor?')) return;
    startTransition(async () => {
      await checkOutVisitor(id);
      await refreshData();
    });
  }

  function toggleQuickOrderItem(itemId: number) {
    setQuickOrder((prev) => {
      const newItems = { ...prev.items };
      if (newItems[itemId]) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = 1;
      }
      return { ...prev, items: newItems };
    });
  }

  function setQuickOrderQty(itemId: number, qty: number) {
    setQuickOrder((prev) => ({
      ...prev,
      items: { ...prev.items, [itemId]: Math.max(1, qty) },
    }));
  }

  function handleQuickOrderSubmit() {
    setOrderError('');
    setOrderSuccess('');
    if (!quickOrder.guestName.trim()) {
      setOrderError('Guest name is required');
      return;
    }
    if (Object.keys(quickOrder.items).length === 0) {
      setOrderError('Select at least one item');
      return;
    }
    startTransition(async () => {
      const itemsPayload = Object.entries(quickOrder.items).map(([id, qty]) => ({
        itemId: Number(id),
        quantity: qty,
      }));
      const result = await createOrder({
        orderType: quickOrder.orderType,
        guestName: quickOrder.guestName,
        roomNumber: quickOrder.roomNumber || undefined,
        items: itemsPayload,
      });
      if (result.success) {
        setOrderSuccess(result.message!);
        setQuickOrder({ guestName: '', orderType: 'dine_in', roomNumber: '', items: {} });
        await refreshData();
        setTimeout(() => { setShowQuickOrder(false); setOrderSuccess(''); }, 2000);
      } else {
        setOrderError(result.error || 'Failed');
      }
    });
  }

  async function handleMarkPaidOrder(orderId: number) {
    if (!confirm('Mark as paid?')) return;
    await markPaid(orderId);
    await refreshData();
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl mb-3" style={{ color: '#c9a96e' }}></i>
          <p className="text-sm text-gray-400">Loading front desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0f1a3c' }}>Front Desk</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: '#c9a96e' }}
          >
            <i className="fas fa-plus"></i> Log Person
          </button>
          <button
            onClick={() => setShowQuickOrder(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: '#059669' }}
          >
            <i className="fas fa-utensils"></i> Quick Order
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatCard icon="fas fa-users" value={stats.activeVisitors} label="Here Now" color="#3b82f6" bg="rgba(59,130,246,0.1)" />
          <StatCard icon="fas fa-calendar-day" value={stats.todayVisitors} label="Today" color="#10b981" bg="rgba(16,185,129,0.1)" />
          <div className="bg-white rounded-xl p-4 border border-gray-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="flex gap-3 flex-wrap">
              <div className="text-center">
                <div className="text-lg font-extrabold" style={{ color: '#059669' }}>{stats.rooms.available}</div>
                <div className="text-[9px] text-gray-400">Free</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold" style={{ color: '#dc2626' }}>{stats.rooms.occupied}</div>
                <div className="text-[9px] text-gray-400">Taken</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold" style={{ color: '#0891b2' }}>{stats.rooms.cleaning}</div>
                <div className="text-[9px] text-gray-400">Clean</div>
              </div>
            </div>
          </div>
          <StatCard icon="fas fa-utensils" value={stats.todayOrders} label="Orders" color="#f97316" bg="rgba(249,115,22,0.1)" />
          <StatCard icon="fas fa-exclamation-circle" value={stats.pendingPayments} label="Unpaid" color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <StatCard icon="fas fa-money-bill-wave" value={formatCurrency(stats.todayRevenue)} label="Revenue" color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-bell"></i> Who&apos;s Here Now ({visitors.length})
              </h2>
            </div>
            {visitors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-check-circle text-3xl mb-2 block" style={{ color: '#10b981' }}></i>
                <p className="text-xs">No one currently at the front desk</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitors.map((v) => (
                  <div key={v.id} className="rounded-xl p-4 bg-white border border-gray-100" style={{ borderLeft: '4px solid #c9a96e', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm" style={{ color: '#0f1a3c' }}>{v.visitor_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {v.visitor_phone && <><i className="fas fa-phone text-[9px] mr-1"></i>{v.visitor_phone} </>}
                          <i className="fas fa-clock text-[9px] mr-1"></i>
                          {new Date(v.time_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {v.room_number && <><i className="fas fa-door-open text-[9px] mx-1"></i>Room {v.room_number}</>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckout(v.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                        style={{ background: '#dc2626' }}
                      >
                        <i className="fas fa-sign-out-alt mr-1"></i>Out
                      </button>
                    </div>
                    <div className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }}>
                      <i className="fas fa-bullseye mr-1"></i> {v.purpose || 'No purpose recorded'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#059669' }}>
                <i className="fas fa-utensils"></i> Recent Orders
              </h2>
              <Link href="/fb/orders" className="text-xs font-semibold" style={{ color: '#c9a96e' }}>
                All Orders <i className="fas fa-arrow-right text-[10px]"></i>
              </Link>
            </div>
            {fbOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-utensils text-3xl opacity-30 mb-2 block"></i>
                <p className="text-xs">No orders yet. Click &quot;Quick Order&quot; to place one.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {fbOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl p-3.5 bg-white border border-gray-100"
                    style={{ borderLeft: `4px solid ${order.payment_status === 'paid' ? '#10b981' : '#f59e0b'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs" style={{ color: '#0f1a3c' }}>#{order.id} — {order.guest_name || 'Guest'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {order.order_type?.replace('_', ' ')} — {formatCurrency(order.total)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <small className="text-gray-400 text-[11px]">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </small>
                      {order.payment_status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaidOrder(order.id)}
                          className="px-3 py-1 rounded-md text-[11px] font-bold text-white"
                          style={{ background: '#059669' }}
                        >
                          <i className="fas fa-check mr-1"></i>Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c)' }}>
              <h2 className="text-base font-bold flex items-center gap-2"><i className="fas fa-bell-concierge"></i> Log Person Entering Hotel</h2>
            </div>
            <div className="p-5 space-y-4">
              {logError && <div className="rounded-lg p-3 text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i className="fas fa-exclamation-circle mr-1"></i> {logError}</div>}
              {logSuccess && <div className="rounded-lg p-3 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i className="fas fa-check-circle mr-1"></i> {logSuccess}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Who is this person? *</label>
                <select value={logForm.personType} onChange={(e) => setLogForm({ ...logForm, personType: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="guest">Guest (Staying at hotel)</option>
                  <option value="visitor">Visitor (Came to see someone)</option>
                  <option value="delivery">Delivery Person</option>
                  <option value="supplier">Supplier / Vendor</option>
                  <option value="inquiry">Walk-in Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
                  <input type="text" value={logForm.name} onChange={(e) => setLogForm({ ...logForm, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="Person's full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                  <input type="tel" value={logForm.phone} onChange={(e) => setLogForm({ ...logForm, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">What does this person want? *</label>
                <div className="grid grid-cols-3 gap-2">
                  {wantsOptions.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setSelectedWants(w.value)}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        selectedWants === w.value
                          ? 'border-[#c9a96e] bg-amber-50 shadow'
                          : 'border-gray-200 hover:border-[#c9a96e] hover:bg-amber-50/50'
                      }`}
                    >
                      <i className={`${w.icon} text-lg block mb-1 ${selectedWants === w.value ? 'text-[#0f1a3c]' : 'text-gray-400'}`}></i>
                      <span className="text-[10px] font-semibold text-gray-600">{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Visiting Room / Guest</label>
                  <input type="text" value={logForm.visitingRoom} onChange={(e) => setLogForm({ ...logForm, visitingRoom: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="Room number or guest name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Vehicle Number</label>
                  <input type="text" value={logForm.vehicleNumber} onChange={(e) => setLogForm({ ...logForm, vehicleNumber: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="e.g. UAX 123A" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowLogModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={handleLogSubmit} disabled={isPending} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                  {isPending ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>}
                  Log Person
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showQuickOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQuickOrder(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #065f46, #059669)' }}>
              <h2 className="text-base font-bold flex items-center gap-2"><i className="fas fa-utensils"></i> Quick Food/Drink Order</h2>
            </div>
            <div className="p-5 space-y-4">
              {orderError && <div className="rounded-lg p-3 text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i className="fas fa-exclamation-circle mr-1"></i> {orderError}</div>}
              {orderSuccess && <div className="rounded-lg p-3 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i className="fas fa-check-circle mr-1"></i> {orderSuccess}</div>}

              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #c4b5fd' }}>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Guest Name *</label>
                    <input type="text" value={quickOrder.guestName} onChange={(e) => setQuickOrder({ ...quickOrder, guestName: e.target.value })} className="w-full rounded-xl border-2 border-indigo-200 px-3 py-3 text-lg font-bold text-gray-800" placeholder="Who is ordering?" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Order Type</label>
                    <select value={quickOrder.orderType} onChange={(e) => setQuickOrder({ ...quickOrder, orderType: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                      <option value="dine_in">Dine In</option>
                      <option value="room_service">Room Service (+5K)</option>
                      <option value="takeaway">Takeaway</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Select Items *</label>
                {fbItems.length === 0 ? (
                  <div className="rounded-lg p-4 bg-amber-50 text-amber-700 text-xs font-semibold"><i className="fas fa-exclamation-triangle mr-1"></i> No food/drink items in stock.</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {fbItems.map((item) => {
                      const isSelected = !!quickOrder.items[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleQuickOrderItem(item.id)}
                          className={`border-2 rounded-lg p-2.5 text-center transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                          }`}
                        >
                          <div className="text-[11px] font-semibold text-gray-700 truncate">{item.name}</div>
                          <div className="text-xs font-bold" style={{ color: '#059669' }}>{formatCurrency(item.price)}</div>
                          <div className="text-[9px] text-gray-400">Stock: {item.stock_quantity}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {Object.keys(quickOrder.items).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">Quantities</label>
                  <div className="space-y-2">
                    {Object.entries(quickOrder.items).map(([itemId, qty]) => {
                      const item = fbItems.find((i) => i.id === Number(itemId));
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <span className="flex-1 text-xs font-semibold text-gray-700">{item.name}</span>
                          <button type="button" onClick={() => setQuickOrderQty(item.id, qty - 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-200">-</button>
                          <span className="w-8 text-center text-xs font-bold">{qty}</span>
                          <button type="button" onClick={() => setQuickOrderQty(item.id, qty + 1)} className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-xs font-bold hover:bg-gray-200">+</button>
                          <span className="text-xs font-bold text-gray-500 w-20 text-right">{formatCurrency(item.price * qty)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowQuickOrder(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Close</button>
                <button onClick={handleQuickOrderSubmit} disabled={isPending} className="px-5 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#059669' }}>
                  {isPending ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>}
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
