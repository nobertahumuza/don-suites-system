'use client';

import { useState, useEffect } from 'react';
import { getShifts, getActiveStaffList, createShift, updateShiftStatus, deleteShift } from '@/lib/actions/staff';

const statusColors: Record<string, string> = { scheduled: '#3b82f6', completed: '#10b981', absent: '#ef4444', leave: '#f59e0b' };

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Array<Record<string, unknown>>>([]);
  const [staffList, setStaffList] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ staff_id: '', shift_date: '', start_time: '08:00', end_time: '17:00', break_minutes: '60', notes: '' });

  useEffect(() => { loadData(); }, [weekStart]);

  async function loadData() {
    setLoading(true);
    try {
      const d = new Date(weekStart);
      const endDate = new Date(d);
      endDate.setDate(endDate.getDate() + 6);
      const [s, sl] = await Promise.all([
        getShifts({ week_start: weekStart, week_end: endDate.toISOString().split('T')[0] }),
        getActiveStaffList()
      ]);
      setShifts(s);
      setStaffList(sl);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getDays() {
    const days = [];
    const d = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
  }

  function getShiftForDay(staffId: number, date: string) {
    return shifts.find((s) => s.staff_id === staffId && s.shift_date === date);
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function thisWeek() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  async function handleCreateShift(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createShift({
        staff_id: Number(form.staff_id),
        shift_date: form.shift_date,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: Number(form.break_minutes) || 0,
        notes: form.notes,
      });
      setShowModal(false);
      setForm({ staff_id: '', shift_date: '', start_time: '08:00', end_time: '17:00', break_minutes: '60', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleStatusChange(shiftId: number, status: string) {
    try {
      await updateShiftStatus(shiftId, status);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(shiftId: number) {
    if (!confirm('Delete this shift?')) return;
    try {
      await deleteShift(shiftId);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  const days = getDays();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const uniqueStaff = Array.from(new Set(shifts.map((s) => s.staff_id as number)))
    .map((id) => {
      const shift = shifts.find((s) => s.staff_id === id);
      return { id, full_name: shift?.full_name, position: shift?.position };
    });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-clock" style={{ color: '#c9a96e' }}></i> Staff Shifts: {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </h1>
        <div className="flex gap-2">
          <button onClick={prevWeek} className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: '#0f1a3c' }}><i className="fas fa-chevron-left"></i></button>
          <button onClick={thisWeek} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#c9a96e' }}>This Week</button>
          <button onClick={nextWeek} className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: '#0f1a3c' }}><i className="fas fa-chevron-right"></i></button>
          <button onClick={() => { setForm({ ...form, shift_date: weekStart }); setShowModal(true); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#0f1a3c' }}>
            <i className="fas fa-plus mr-1"></i> Add Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#0f1a3c', color: '#fff' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3" style={{ minWidth: 150 }}>Staff</th>
                {days.map((day) => (
                  <th key={day.date} className="text-center text-white text-[10px] font-semibold px-2 py-3" style={{ minWidth: 110, background: (day.label === 'Sat' || day.label === 'Sun') ? '#1a2d5a' : undefined }}>
                    {day.label}<br /><span className="text-[9px] opacity-70">{day.month} {day.dayNum}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400"><i className="fas fa-spinner fa-spin text-2xl"></i></td></tr>
              ) : uniqueStaff.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No shifts scheduled</td></tr>
              ) : (
                uniqueStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-semibold text-xs whitespace-nowrap">
                      {staff.full_name as string}<br />
                      <span className="text-[10px] text-gray-400 font-normal">{staff.position as string}</span>
                    </td>
                    {days.map((day) => {
                      const shift = getShiftForDay(staff.id, day.date);
                      if (!shift) return <td key={day.date} className="text-center text-gray-200 text-[10px] px-2 py-3">-</td>;
                      const color = statusColors[shift.status as string] || '#94a3b8';
                      return (
                        <td key={day.date} className="text-center px-2 py-3">
                          <div className="rounded-md p-1 text-[10px] border" style={{ background: `${color}15`, borderColor: `${color}40` }}>
                            <div className="font-bold" style={{ color }}>{shift.start_time as string} - {shift.end_time as string}</div>
                            {Number(shift.break_minutes) > 0 && <div className="text-[9px] text-gray-400">{String(shift.break_minutes)}min break</div>}
                            <div className="flex justify-center gap-0.5 mt-1">
                              {['scheduled', 'completed', 'absent', 'leave'].map((s) => (
                                <button key={s} onClick={() => handleStatusChange(shift.id as number, s)} title={s} className="w-3 h-3 rounded-full border-2 cursor-pointer" style={{ borderColor: statusColors[s], background: shift.status === s ? statusColors[s] : 'transparent' }} />
                              ))}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-[11px]">
        {Object.entries(statusColors).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></span> {label.charAt(0).toUpperCase() + label.slice(1)}
          </span>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold">Schedule Shift</h2>
              <button onClick={() => setShowModal(false)} className="text-xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreateShift} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Member *</label>
                <select required value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>{String(s.full_name)} ({String(s.position)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
                <input type="date" required value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time *</label>
                  <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">End Time *</label>
                  <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Break (minutes)</label>
                <input type="number" min="0" value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" placeholder="Optional notes" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: '#0f1a3c' }}>
                <i className="fas fa-save mr-1"></i> Schedule Shift
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
