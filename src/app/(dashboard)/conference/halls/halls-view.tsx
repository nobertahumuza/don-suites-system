'use client';

import { useState } from 'react';
import { createConferenceHall, updateConferenceHall, deleteConferenceHall } from '@/lib/actions/conference';

type Hall = {
  id: number;
  name: string;
  capacity: number | null;
  price_per_day: number;
  type: string | null;
  status: string | null;
  description: string | null;
  booking_count: number;
  created_at: Date | null;
};

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

function StatusBadge({ status }: { status: string | null }) {
  const isAvailable = status === 'available';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: isAvailable ? '#dcfce7' : '#fee2e2', color: isAvailable ? '#166534' : '#991b1b' }}
    >
      {status || 'available'}
    </span>
  );
}

export default function HallsView({ halls: initial }: { halls: Hall[] }) {
  const [halls, setHalls] = useState<Hall[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editItem, setEditItem] = useState<Hall | null>(null);
  const [deleteItem, setDeleteItem] = useState<Hall | null>(null);
  const [form, setForm] = useState({ name: '', capacity: '', price_per_day: '', type: '', status: 'available', description: '' });
  const [loading, setLoading] = useState(false);

  function openAdd() {
    setEditItem(null);
    setForm({ name: '', capacity: '', price_per_day: '', type: '', status: 'available', description: '' });
    setShowModal(true);
  }

  function openEdit(item: Hall) {
    setEditItem(item);
    setForm({
      name: item.name,
      capacity: String(item.capacity ?? ''),
      price_per_day: String(item.price_per_day),
      type: item.type || '',
      status: item.status || 'available',
      description: item.description || '',
    });
    setShowModal(true);
  }

  function openDelete(item: Hall) {
    setDeleteItem(item);
    setShowDeleteModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        capacity: Number(form.capacity) || 0,
        price_per_day: Number(form.price_per_day) || 0,
        type: form.type,
        status: form.status,
        description: form.description,
      };
      if (editItem) {
        await updateConferenceHall(editItem.id, payload);
      } else {
        await createConferenceHall(payload);
      }
      setShowModal(false);
      const { getConferenceHallsWithStats } = await import('@/lib/actions/conference');
      const updated = await getConferenceHallsWithStats();
      setHalls(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await deleteConferenceHall(deleteItem.id);
      setShowDeleteModal(false);
      const { getConferenceHallsWithStats } = await import('@/lib/actions/conference');
      const updated = await getConferenceHallsWithStats();
      setHalls(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-building" style={{ color: '#c9a96e' }}></i> Conference Halls
        </h1>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#059669' }}>
          <i className="fas fa-plus"></i> New Hall
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Name</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Type</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Capacity</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Price/Day</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Bookings</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Status</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {halls.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No halls found</td></tr>
              ) : (
                halls.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-xs">{h.name}</div>
                      {h.description && <div className="text-[10px] text-gray-400 mt-0.5 max-w-[200px] truncate">{h.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{h.type || '-'}</td>
                    <td className="px-4 py-3 text-xs">{h.capacity || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(h.price_per_day)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">{h.booking_count}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(h)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                        <button onClick={() => openDelete(h)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-building" style={{ color: '#c9a96e' }}></i> {editItem ? 'Edit Hall' : 'Add Hall'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity</label>
                  <input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price/Day (UGX) *</label>
                  <input type="number" min="0" required value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Conference, Meeting" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" rows={3}></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>}
                {editItem ? 'Update Hall' : 'Add Hall'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-red-500"></i> Delete Hall
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{deleteItem.name}</strong>? This action cannot be undone.
              </p>
              {deleteItem.booking_count > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-600"><i className="fas fa-exclamation-circle mr-1"></i>This hall has {deleteItem.booking_count} existing booking(s) and cannot be deleted.</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={handleDelete} disabled={loading || deleteItem.booking_count > 0} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                  {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-trash mr-1"></i>} Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
