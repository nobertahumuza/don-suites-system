'use client';

import { useState, useEffect } from 'react';
import { getParkingStats, getParkingRecords, getGuests, checkInVehicle, checkOutVehicle } from '@/lib/actions/parking';

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function calcDuration(checkIn: string, checkOut?: string | null) {
  const ci = new Date(checkIn);
  const co = checkOut ? new Date(checkOut) : new Date();
  const diffMs = co.getTime() - ci.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  let str = '';
  if (days > 0) str += days + 'd ';
  str += hours + 'h ' + mins + 'm';
  return str;
}

const VEHICLE_MAKES = [
  { group: 'Toyota', items: ['Toyota Corolla', 'Toyota Premio', 'Toyota Allion', 'Toyota Harrier', 'Toyota RAV4', 'Toyota Hiace', 'Toyota Land Cruiser', 'Toyota Prado', 'Toyota Hilux', 'Toyota Vitz', 'Toyota Noah', 'Toyota Voxy', 'Toyota Fielder', 'Toyota Ipsum', 'Toyota Coaster', 'Toyota Dyna'] },
  { group: 'Nissan', items: ['Nissan Note', 'Nissan Tiida', 'Nissan X-Trail', 'Nissan Patrol', 'Nissan NP300', 'Nissan Qashqai', 'Nissan Juke'] },
  { group: 'Honda', items: ['Honda Fit', 'Honda CR-V', 'Honda Civic', 'Honda Stream'] },
  { group: 'Subaru', items: ['Subaru Forester', 'Subaru Impreza', 'Subaru Legacy', 'Subaru Outback'] },
  { group: 'Mazda', items: ['Mazda Demio', 'Mazda CX-5', 'Mazda 3', 'Mazda 6', 'Mazda BT-50'] },
  { group: 'Mitsubishi', items: ['Mitsubishi Pajero', 'Mitsubishi L200', 'Mitsubishi Outlander', 'Mitsubishi Galant', 'Mitsubishi Fuso'] },
  { group: 'Suzuki', items: ['Suzuki Swift', 'Suzuki Jimny', 'Suzuki Alto', 'Suzuki Vitara'] },
  { group: 'Hyundai', items: ['Hyundai Tucson', 'Hyundai i10', 'Hyundai Elantra', 'Hyundai Santa Fe'] },
  { group: 'Kia', items: ['Kia Sportage', 'Kia Picanto', 'Kia Rio', 'Kia Sorento', 'Kia Cerato'] },
  { group: 'Mercedes Benz', items: ['Mercedes C-Class', 'Mercedes E-Class', 'Mercedes ML', 'Mercedes GL'] },
  { group: 'Volkswagen', items: ['Volkswagen Golf', 'Volkswagen Polo', 'Volkswagen Tiguan'] },
  { group: 'Isuzu', items: ['Isuzu D-Max', 'Isuzu NPR', 'Isuzu NKR', 'Isuzu MU-X'] },
  { group: 'Other', items: ['BAW', 'Great Wall', 'Chery', 'BYD', 'Haval', 'Ford Ranger', 'Ford Escape', 'Range Rover', 'Land Rover', 'Other'] },
];

export default function ParkingPage() {
  const [filter, setFilter] = useState('parked');
  const [stats, setStats] = useState({ parkedCount: 0, todayCount: 0, todayRevenue: 0 });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    plate_number: '',
    vehicle_make: '',
    vehicle_type: 'sedan',
    color: '',
    owner_name: '',
    owner_phone: '',
    guest_id: '',
    parking_spot: '',
    parking_rate: 5000,
    notes: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const [s, v, g] = await Promise.all([getParkingStats(), getParkingRecords(filter), getGuests()]);
      setStats(s);
      setVehicles(v);
      setGuests(g);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [filter]);

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await checkInVehicle({
        ...form,
        guest_id: form.guest_id ? Number(form.guest_id) : undefined,
      });
      setMsg('Vehicle checked in successfully!');
      setForm({ plate_number: '', vehicle_make: '', vehicle_type: 'sedan', color: '', owner_name: '', owner_phone: '', guest_id: '', parking_spot: '', parking_rate: 5000, notes: '' });
      loadData();
    } catch (err: any) {
      setMsg(err.message || 'Failed to check in');
    }
    setSubmitting(false);
  }

  async function handleCheckOut(id: number) {
    if (!confirm('Check out this vehicle?')) return;
    try {
      await checkOutVehicle(id);
      loadData();
    } catch { /* empty */ }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: 'linear-gradient(135deg, #080e22, #0f1a3c, #1a2d5a)' }}>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fas fa-parking" style={{ color: '#c9a96e' }}></i>
          Vehicle Parking
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Manage vehicle parking check-in and check-out</p>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <i className={`fas ${msg.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1`}></i> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0f1a3c]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(15,26,60,0.1)', color: '#0f1a3c' }}>
            <i className="fas fa-car"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.parkedCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Currently Parked</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{stats.todayCount}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Check-ins</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a96e]"></div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm mb-2" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
            <i className="fas fa-coins"></i>
          </div>
          <div className="text-xl font-extrabold text-gray-900">{formatCurrency(stats.todayRevenue)}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Today&apos;s Parking Revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#0f1a3c' }}>
              <i className="fas fa-plus-circle" style={{ color: '#c9a96e' }}></i> Park Vehicle
            </h3>
            <form onSubmit={handleCheckIn} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Plate Number *</label>
                <input type="text" required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. UAX 123A" maxLength={20} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Vehicle Make / Model</label>
                <select value={form.vehicle_make} onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">-- Select Vehicle --</option>
                  {VEHICLE_MAKES.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map((m) => <option key={m} value={m}>{m}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Type</label>
                  <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="van">Van</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Color</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="e.g. White" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Owner Name *</label>
                <input type="text" required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Owner Phone</label>
                <input type="text" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="+256..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Guest (if staying)</label>
                <select value={form.guest_id} onChange={(e) => setForm({ ...form, guest_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <option value="">-- Not a guest --</option>
                  {guests.map((g: any) => <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Rate (UGX/hr)</label>
                  <input type="number" value={form.parking_rate} onChange={(e) => setForm({ ...form, parking_rate: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" min={0} step={500} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Spot *</label>
                  <select required value={form.parking_spot} onChange={(e) => setForm({ ...form, parking_spot: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <option value="">-- Select --</option>
                    <option value="Lower Terrace">Lower Terrace</option>
                    <option value="Upper Terrace">Upper Terrace</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" rows={2} placeholder="Optional notes"></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                {submitting ? <><i className="fas fa-spinner fa-spin mr-1"></i> Processing...</> : <><i className="fas fa-parking mr-1"></i> Check In Vehicle</>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-100 gap-3">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
                <i className="fas fa-car" style={{ color: '#c9a96e' }}></i> Parking Records
              </h3>
              <div className="flex gap-1">
                {(['parked', 'departed', 'all'] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${filter === f ? (f === 'parked' ? 'bg-amber-500 text-white' : f === 'departed' ? 'bg-gray-500 text-white' : 'text-white') : 'bg-gray-100 text-gray-500'}`} style={filter === f && f === 'all' ? { background: '#0f1a3c' } : {}}>
                    {f === 'parked' ? `Parked (${stats.parkedCount})` : f === 'departed' ? 'Departed' : 'All'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-xl"></i></div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>
                <p className="text-sm">No vehicles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                      {['Plate', 'Vehicle', 'Owner', 'Guest', 'Spot', 'Rate/hr', 'Check-in', 'Duration', 'Charge', 'Action'].map((h) => (
                        <th key={h} className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((v: any) => (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-3"><span className="font-extrabold text-xs" style={{ color: '#0f1a3c' }}>{v.plate_number}</span></td>
                        <td className="px-3 py-3 text-xs capitalize">{v.vehicle_type} {v.color ? `(${v.color})` : ''}</td>
                        <td className="px-3 py-3 text-xs">{v.owner_name}<br /><span className="text-gray-400 text-[10px]">{v.owner_phone}</span></td>
                        <td className="px-3 py-3 text-xs">{v.guest_name || <span className="text-gray-300">-</span>}</td>
                        <td className="px-3 py-3 text-xs">{v.parking_spot || '-'}</td>
                        <td className="px-3 py-3 text-xs">{v.parking_rate > 0 ? formatCurrency(v.parking_rate) : '-'}</td>
                        <td className="px-3 py-3 text-xs whitespace-nowrap">{new Date(v.check_in).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                        <td className="px-3 py-3 text-xs font-semibold" style={{ color: v.status === 'parked' ? '#f59e0b' : '#10b981' }}>
                          {calcDuration(v.check_in, v.check_out)}
                        </td>
                        <td className="px-3 py-3 text-xs font-bold" style={{ color: '#059669' }}>
                          {v.total_charge > 0 ? formatCurrency(v.total_charge) : (v.status === 'parked' ? '...' : '-')}
                        </td>
                        <td className="px-3 py-3">
                          {v.status === 'parked' ? (
                            <button onClick={() => handleCheckOut(v.id)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600">
                              <i className="fas fa-sign-out-alt mr-1"></i> Out
                            </button>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Departed</span>
                          )}
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
    </div>
  );
}
