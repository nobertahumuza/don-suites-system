'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, getFbItems, getActiveBookings } from '@/lib/actions/fb';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  image: string | null;
  category_id: number | null;
  category_name: string;
}

interface Booking {
  id: number;
  room_id: number;
  full_name: string;
  room_number: string;
}

interface SelectedItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  stock: number;
}

const ROOM_SERVICE_SURCHARGE = 5000;

const catIcons: Record<string, string> = {
  beer: 'fas fa-beer',
  spirit: 'fas fa-wine-glass',
  soft_drink: 'fas fa-glass-water',
  water: 'fas fa-tint',
  juice: 'fas fa-glass-whiskey',
  wine: 'fas fa-wine-bottle',
  snack: 'fas fa-cookie',
  buffet: 'fas fa-utensils',
  served_meal: 'fas fa-plate-wheat',
};

const catColors: Record<string, string> = {
  beer: '#f59e0b',
  spirit: '#8b5cf6',
  soft_drink: '#06b6d4',
  water: '#3b82f6',
  juice: '#10b981',
  wine: '#ef4444',
  snack: '#f97316',
  buffet: '#c9a96e',
  served_meal: '#0f1a3c',
};

function formatCurrency(amount: number) {
  return 'UGX ' + amount.toLocaleString();
}

export default function NewOrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('dine_in');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<number, SelectedItem>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([getFbItems(), getActiveBookings()])
      .then(([itemsData, bookingsData]) => {
        setItems(itemsData.map((item: any) => ({ ...item, price: Number(item.price), stock_quantity: item.stock_quantity ?? 0, category_name: item.category_name ?? '', category_id: item.category_id ?? 0 })) as MenuItem[]);
        setBookings(bookingsData as Booking[]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load menu items');
        setLoading(false);
      });
  }, []);

  function toggleItem(item: MenuItem) {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          stock: item.stock_quantity,
        };
      }
      return next;
    });
  }

  function changeQty(id: number, delta: number) {
    setSelectedItems((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = Math.max(1, Math.min(item.qty + delta, item.stock));
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  }

  const subtotal = Object.values(selectedItems).reduce((sum, item) => sum + item.price * item.qty, 0);
  const surcharge = orderType === 'room_service' ? ROOM_SERVICE_SURCHARGE : 0;
  const total = subtotal + surcharge;

  const groupedItems: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const catName = item.category_name || 'Other';
    if (!groupedItems[catName]) groupedItems[catName] = [];
    groupedItems[catName].push(item);
  }

  async function handleSubmit() {
    if (Object.keys(selectedItems).length === 0) {
      setError('Please select at least one item');
      return;
    }
    if (!guestName.trim()) {
      setError('Guest name is required');
      return;
    }

    setError('');
    setSuccess('');

    const itemsPayload = Object.values(selectedItems).map((item) => ({
      itemId: item.id,
      quantity: item.qty,
    }));

    const booking = orderType === 'room_service' ? bookings.find((b) => b.room_number === roomNumber) : undefined;

    startTransition(async () => {
      const result = await createOrder({
        orderType,
        guestName: guestName.trim(),
        roomNumber: roomNumber.trim() || undefined,
        bookingId: booking?.id,
        items: itemsPayload,
      });

      if (result.success) {
        setSuccess(result.message!);
        setSelectedItems({});
        setGuestName('');
        setRoomNumber('');
        window.open(`/receipt?type=fb&id=${result.orderId}`, '_blank');
      } else {
        setError(result.error || 'Failed to place order');
      }
    });
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl mb-3" style={{ color: '#c9a96e' }}></i>
          <p className="text-sm text-gray-400">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fas fa-utensils" style={{ color: '#c9a96e' }}></i>
              New F&B Order
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Select items and place your order</p>
          </div>
          <Link href="/fb/orders" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/70 border border-white/20 hover:bg-white/10">
            <i className="fas fa-list"></i> View Orders
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'dine_in', icon: 'fas fa-chair', label: 'Dine In', desc: 'Eat at the restaurant' },
              { type: 'room_service', icon: 'fas fa-concierge-bell', label: 'Room Service', desc: 'Deliver to guest room', surcharge: true },
              { type: 'takeaway', icon: 'fas fa-shopping-bag', label: 'Takeaway', desc: 'Pack to go' },
            ].map((t) => (
              <button
                key={t.type}
                onClick={() => setOrderType(t.type)}
                className={`border-2 rounded-xl p-4 text-center transition-all duration-200 relative ${
                  orderType === t.type
                    ? 'border-[#c9a96e] bg-gradient-to-br from-amber-50 to-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#c9a96e] hover:-translate-y-0.5'
                }`}
              >
                {t.surcharge && orderType === t.type && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">+5K</span>
                )}
                <i className={`${t.icon} text-2xl mb-2 block ${orderType === t.type ? 'text-[#c9a96e]' : 'text-gray-400'}`}></i>
                <div className="font-bold text-sm text-gray-700">{t.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl p-5 border-2" style={{ borderColor: '#7c3aed', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-user text-lg" style={{ color: '#7c3aed' }}></i>
              <span className="font-extrabold text-sm uppercase tracking-wider" style={{ color: '#5b21b6' }}>Customer Details</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Guest Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Who is ordering?"
                  className="w-full rounded-xl border-2 border-indigo-200 px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Room # (optional)</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full rounded-xl border-2 border-indigo-200 px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>
          </div>

          {Object.entries(groupedItems).map(([catName, catItems]) => {
            const color = catColors[catItems[0]?.category_name] || '#94a3b8';
            const icon = catIcons[catItems[0]?.category_name] || 'fas fa-utensils';
            return (
              <div key={catName} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: `${color}15`, color }}>
                    <i className={`${icon}`}></i>
                  </span>
                  {catName}
                  <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{catItems.length}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {catItems.map((item) => {
                    const isSelected = !!selectedItems[item.id];
                    const sel = selectedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isSelected
                            ? 'border-emerald-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-[#c9a96e] hover:-translate-y-0.5 hover:shadow'
                        }`}
                      >
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <i className="fas fa-check text-white text-[8px]"></i>}
                        </div>

                        {item.image ? (
                          <div className="mb-2">
                            <img src={`/${item.image}`} alt={item.name} className="w-full h-20 rounded-lg object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: `${color}15`, color }}>
                            <i className={icon}></i>
                          </div>
                        )}

                        <div className="font-bold text-xs text-gray-800 truncate">{item.name}</div>
                        <div className="font-extrabold text-sm mt-0.5" style={{ color: '#c9a96e' }}>{formatCurrency(item.price)}</div>
                        <div className={`text-[10px] mt-0.5 ${item.stock_quantity <= 5 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          <i className="fas fa-box mr-0.5"></i> {item.stock_quantity} in stock
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold hover:bg-[#0f1a3c] hover:text-white transition-colors">-</button>
                            <span className="w-8 text-center font-bold text-sm">{sel?.qty || 1}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-bold hover:bg-[#0f1a3c] hover:text-white transition-colors">+</button>
                          </div>
                        )}
                        {isSelected && (
                          <div className="text-[10px] font-bold text-emerald-600 mt-1">
                            {formatCurrency(item.price * (sel?.qty || 1))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
              <i className="fas fa-box-open text-4xl text-gray-200 mb-3 block"></i>
              <h3 className="text-gray-400 font-semibold">No Items Available</h3>
              <p className="text-sm text-gray-300 mt-1">Add items in F&B Items management first.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl p-5 text-white sticky top-4" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-receipt" style={{ color: '#c9a96e' }}></i> Order Summary
            </h3>

            {Object.keys(selectedItems).length === 0 ? (
              <div className="text-center py-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className="fas fa-hand-pointer text-3xl mb-2 block"></i>
                <p className="text-xs">Click items to add them</p>
              </div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
                  {Object.values(selectedItems).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs pb-2 border-b border-white/10">
                      <span>
                        {item.name} <span style={{ color: '#c9a96e' }} className="font-bold">x{item.qty}</span>
                      </span>
                      <span>{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {surcharge > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Room Service Fee</span>
                      <span>{formatCurrency(surcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-[#c9a96e] mt-2 text-lg font-extrabold">
                    <span>Total</span>
                    <span style={{ color: '#c9a96e' }}>{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="mt-3 rounded-lg p-3 text-xs font-semibold" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                <i className="fas fa-exclamation-circle mr-1"></i> {error}
              </div>
            )}

            {success && (
              <div className="mt-3 rounded-lg p-3 text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '1px solid #34d399', color: '#065f46' }}>
                <i className="fas fa-check-circle mr-1"></i> {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || Object.keys(selectedItems).length === 0}
              className="w-full mt-4 py-3 rounded-xl font-extrabold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #b8944f)', color: '#080e22' }}
            >
              {isPending ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Placing...</>
              ) : (
                <><i className="fas fa-check-circle mr-2"></i>Place Order</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
