'use client';

import { useState } from 'react';
import { createRoomType, updateRoomType, deleteRoomType } from '@/lib/actions/booking';

type RoomType = {
  id: number;
  name: string;
  price: number;
  cooking_space_price: number;
  description: string | null;
  total_rooms: number;
  created_at: Date | null;
};

function formatCurrency(amount: number) {
  return 'UGX ' + Number(amount).toLocaleString();
}

export default function TypesView({ roomTypes: initial }: { roomTypes: RoomType[] }) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editItem, setEditItem] = useState<RoomType | null>(null);
  const [deleteItem, setDeleteItem] = useState<RoomType | null>(null);
  const [form, setForm] = useState({ name: '', price: '', cooking_space_price: '', description: '' });
  const [loading, setLoading] = useState(false);

  function openAdd() {
    setEditItem(null);
    setForm({ name: '', price: '', cooking_space_price: '', description: '' });
    setShowModal(true);
  }

  function openEdit(item: RoomType) {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      cooking_space_price: String(item.cooking_space_price),
      description: item.description || '',
    });
    setShowModal(true);
  }

  function openDelete(item: RoomType) {
    setDeleteItem(item);
    setShowDeleteModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price) || 0,
        cooking_space_price: Number(form.cooking_space_price) || 0,
        description: form.description,
      };
      if (editItem) {
        await updateRoomType(editItem.id, payload);
      } else {
        await createRoomType(payload);
      }
      setShowModal(false);
      const { getRoomTypes } = await import('@/lib/actions/booking');
      const updated = await getRoomTypes();
      setRoomTypes(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await deleteRoomType(deleteItem.id);
      setShowDeleteModal(false);
      const { getRoomTypes } = await import('@/lib/actions/booking');
      const updated = await getRoomTypes();
      setRoomTypes(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-layer-group" style={{ color: '#c9a96e' }}></i> Room Types
        </h1>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#059669' }}>
          <i className="fas fa-plus"></i> New Room Type
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Name</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Price</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Cooking Space Price</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Total Rooms</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400"><i className="fas fa-info-circle text-2xl mb-2 block opacity-30"></i>No room types found</td></tr>
              ) : (
                roomTypes.map((rt) => (
                  <tr key={rt.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-xs">{rt.name}</div>
                      {rt.description && <div className="text-[10px] text-gray-400 mt-0.5">{rt.description}</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#0f1a3c' }}>{formatCurrency(rt.price)}</td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#c9a96e' }}>{formatCurrency(rt.cooking_space_price)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">{rt.total_rooms}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(rt)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-blue-200 text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                        <button onClick={() => openDelete(rt)} className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] border border-red-200 text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
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
                <i className="fas fa-layer-group" style={{ color: '#c9a96e' }}></i> {editItem ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price/Night (UGX) *</label>
                  <input type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cooking Space Price (UGX)</label>
                  <input type="number" min="0" value={form.cooking_space_price} onChange={(e) => setForm({ ...form, cooking_space_price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" rows={3}></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                {loading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>}
                {editItem ? 'Update Room Type' : 'Add Room Type'}
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
                <i className="fas fa-exclamation-triangle text-red-500"></i> Delete Room Type
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{deleteItem.name}</strong>? This action cannot be undone.
              </p>
              {deleteItem.total_rooms > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-600"><i className="fas fa-exclamation-circle mr-1"></i>This room type has {deleteItem.total_rooms} linked room(s) and cannot be deleted.</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={handleDelete} disabled={loading || deleteItem.total_rooms > 0} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
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
