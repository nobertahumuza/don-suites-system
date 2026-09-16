'use client';

import { useState, useEffect } from 'react';
import { getGuests, getGuestStats, createGuest, updateGuest, getGuestBookings } from '@/lib/actions/guests';

type Guest = {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  sex: string | null;
  age: number | null;
  id_type: string | null;
  id_number: string | null;
  nationality: string | null;
  vehicle_number: string | null;
  created_at: Date | null;
  booking_count: number;
};

type Stats = { total: number; male: number; female: number; newThisMonth: number };

type Booking = {
  id: number;
  room_number: string;
  check_in_date: Date;
  check_out_date: Date;
  total_amount: number;
  amount_paid: number;
  status: string | null;
  nights: number | null;
  created_at: Date | null;
};

export default function GuestsView({
  guests: initialGuests,
  stats: initialStats,
  search: initialSearch,
  nationality: initialNationality,
}: {
  guests: Guest[];
  stats: Stats;
  search?: string;
  nationality?: string;
}) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [search, setSearch] = useState(initialSearch || '');
  const [nationalityFilter, setNationalityFilter] = useState(initialNationality || '');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editItem, setEditItem] = useState<Guest | null>(null);
  const [historyGuest, setHistoryGuest] = useState<Guest | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const emptyForm = { full_name: '', phone: '', email: '', sex: '', age: '', id_type: 'national_id', id_number: '', nationality: '', vehicle_number: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadData(); }, [search, nationalityFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [g, st] = await Promise.all([
        getGuests({ search: search || undefined, nationality: nationalityFilter || undefined }),
        getGuestStats(),
      ]);
      setGuests(g);
      setStats(st);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setShowCreateModal(true);
  }

  function openEdit(item: Guest) {
    setEditItem(item);
    setForm({
      full_name: item.full_name || '',
      phone: item.phone || '',
      email: item.email || '',
      sex: item.sex || '',
      age: String(item.age ?? ''),
      id_type: item.id_type || 'national_id',
      id_number: item.id_number || '',
      nationality: item.nationality || '',
      vehicle_number: item.vehicle_number || '',
    });
    setShowEditModal(true);
  }

  async function openHistory(item: Guest) {
    setHistoryGuest(item);
    setShowHistoryModal(true);
    setLoadingBookings(true);
    try {
      const b = await getGuestBookings(item.id);
      setBookings(b);
    } catch (e) { console.error(e); }
    setLoadingBookings(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, age: Number(form.age) || 0 };
      if (editItem) {
        await updateGuest(editItem.id, payload);
      } else {
        await createGuest(payload);
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-users" style={{ color: '#c9a96e' }}></i> Guest Management
        </h1>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#059669' }}>
          <i className="fas fa-user-plus"></i> New Guest
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Guests', value: stats.total, icon: 'fas fa-users', color: '#0f1a3c', bg: '#eef2ff' },
          { label: 'Male', value: stats.male, icon: 'fas fa-mars', color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Female', value: stats.female, icon: 'fas fa-venus', color: '#ec4899', bg: '#fdf2f8' },
          { label: 'New This Month', value: stats.newThisMonth, icon: 'fas fa-user-plus', color: '#10b981', bg: '#ecfdf5' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <i className={`${s.icon} text-sm mb-2 block`} style={{ color: s.color }}></i>
            <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, email..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nationality</label>
            <input type="text" value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)} placeholder="Filter by nationality..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
          </div>
          <button onClick={() => { setSearch(''); setNationalityFilter(''); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Name</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Phone</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Email</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Sex</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Nationality</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Bookings</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
              ) : guests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No guests found</td></tr>
              ) : (
                guests.map((g) => (
                  <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                          {g.full_name[0]?.toUpperCase()}
                        </div>
                        <div className="font-bold text-xs">{g.full_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{g.phone || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{g.email || '-'}</td>
                    <td className="px-4 py-3 text-xs capitalize">{g.sex || '-'}</td>
                    <td className="px-4 py-3 text-xs">{g.nationality || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">{g.booking_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openHistory(g)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-green-200 text-green-600 hover:bg-green-50" title="View History"><i className="fas fa-history"></i></button>
                        <button onClick={() => openEdit(g)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-user-edit" style={{ color: '#c9a96e' }}></i> {editItem ? 'Edit Guest' : 'Add Guest'}
              </h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Sex</label>
                  <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
                  <input type="number" min="0" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nationality</label>
                  <input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID Type</label>
                  <select value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ID Number</label>
                  <input type="text" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle #</label>
                  <input type="text" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> {editItem ? 'Update Guest' : 'Add Guest'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historyGuest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-history" style={{ color: '#c9a96e' }}></i> Booking History - {historyGuest.full_name}
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-5">
              {loadingBookings ? (
                <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No bookings found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">#</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Room</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Check-in</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Check-out</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Nights</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Total</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Paid</th>
                        <th className="text-left text-white text-[10px] font-semibold px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-3 py-2 font-bold text-xs" style={{ color: '#0f1a3c' }}>#{b.id}</td>
                          <td className="px-3 py-2 text-xs">{b.room_number}</td>
                          <td className="px-3 py-2 text-xs">{new Date(b.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-3 py-2 text-xs">{new Date(b.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                          <td className="px-3 py-2 text-xs">{b.nights || '-'}</td>
                          <td className="px-3 py-2 font-bold text-xs" style={{ color: '#0f1a3c' }}>UGX {b.total_amount.toLocaleString()}</td>
                          <td className="px-3 py-2 font-bold text-xs" style={{ color: '#10b981' }}>UGX {b.amount_paid.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === 'checked_out' ? 'bg-emerald-100 text-emerald-700' :
                              b.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                              b.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                              b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
