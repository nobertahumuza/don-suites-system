'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [rows] = await pool.execute('SELECT * FROM users ORDER BY role, full_name');
  return rows as Array<Record<string, unknown>>;
}

export async function toggleUserStatus(userId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [rows] = await pool.execute('SELECT status FROM users WHERE id = ?', [userId]);
  const current = (rows as Array<Record<string, unknown>>)[0];
  if (!current) throw new Error('User not found');
  const newStatus = current.status === 'active' ? 'inactive' : 'active';
  await pool.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);
  revalidatePath('/staff/users');
  return { success: true, status: newStatus };
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'admin') throw new Error('Admin access required');
  if (!newPassword || newPassword.length < 4) throw new Error('Password must be at least 4 characters');
  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
  revalidatePath('/staff/users');
  return { success: true };
}

export async function getStaff(filters?: { status?: string; search?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  let query = 'SELECT * FROM staff';
  const params: string[] = [];
  const conditions: string[] = [];

  if (filters?.status && ['active', 'inactive'].includes(filters.status)) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters?.search) {
    conditions.push('(full_name LIKE ? OR position LIKE ? OR phone LIKE ? OR email LIKE ?)');
    const s = `%${filters.search}%`;
    params.push(s, s, s, s);
  }
  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY full_name ASC';

  const [rows] = await pool.execute(query, params);
  return rows as Array<Record<string, unknown>>;
}

export async function getStaffStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [total] = await pool.execute('SELECT COUNT(*) as c FROM staff') as [Array<Record<string, unknown>>, unknown];
  const [active] = await pool.execute("SELECT COUNT(*) as c FROM staff WHERE status='active'") as [Array<Record<string, unknown>>, unknown];
  const [inactive] = await pool.execute("SELECT COUNT(*) as c FROM staff WHERE status='inactive'") as [Array<Record<string, unknown>>, unknown];
  const [wages] = await pool.execute("SELECT COALESCE(SUM(wage),0) as c FROM staff WHERE status='active'") as [Array<Record<string, unknown>>, unknown];
  return {
    total: Number(total[0]?.c ?? 0),
    active: Number(active[0]?.c ?? 0),
    inactive: Number(inactive[0]?.c ?? 0),
    totalWages: Number(wages[0]?.c ?? 0),
  };
}

export async function createStaff(data: {
  full_name: string;
  gender: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  contract_type: string;
  wage: number;
  hire_date: string;
  status: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { full_name, gender, phone, email, position, department, contract_type, wage, hire_date, status } = data;
  if (!full_name) throw new Error('Full name is required');
  if (!position) throw new Error('Position is required');

  await pool.execute(
    'INSERT INTO staff (full_name, gender, phone, email, position, department, contract_type, wage, hire_date, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [full_name, gender || null, phone || null, email || null, position, department || null, contract_type || 'permanent', wage || 0, hire_date || null, status || 'active']
  );
  revalidatePath('/staff');
  return { success: true };
}

export async function updateStaff(staffId: number, data: {
  full_name: string;
  gender: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  contract_type: string;
  wage: number;
  hire_date: string;
  status: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { full_name, gender, phone, email, position, department, contract_type, wage, hire_date, status } = data;
  if (!full_name) throw new Error('Full name is required');
  if (!position) throw new Error('Position is required');

  await pool.execute(
    'UPDATE staff SET full_name=?, gender=?, phone=?, email=?, position=?, department=?, contract_type=?, wage=?, hire_date=?, status=? WHERE id=?',
    [full_name, gender || null, phone || null, email || null, position, department || null, contract_type || 'permanent', wage || 0, hire_date || null, status || 'active', staffId]
  );
  revalidatePath('/staff');
  return { success: true };
}

export async function deleteStaff(staffId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.execute('DELETE FROM staff WHERE id = ?', [staffId]);
  revalidatePath('/staff');
  return { success: true };
}

export async function getShifts(filters?: { week_start?: string; week_end?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  let query = `SELECT ss.*, s.full_name, s.position FROM staff_shifts ss JOIN staff s ON ss.staff_id = s.id`;
  const params: string[] = [];

  if (filters?.week_start && filters?.week_end) {
    query += ' WHERE ss.shift_date BETWEEN ? AND ?';
    params.push(filters.week_start, filters.week_end);
  }
  query += ' ORDER BY ss.shift_date, ss.start_time';

  const [rows] = await pool.execute(query, params);
  return rows as Array<Record<string, unknown>>;
}

export async function getActiveStaffList() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [rows] = await pool.execute("SELECT id, full_name, position FROM staff WHERE status = 'active' ORDER BY full_name");
  return rows as Array<Record<string, unknown>>;
}

export async function createShift(data: {
  staff_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { staff_id, shift_date, start_time, end_time, break_minutes, notes } = data;
  if (!staff_id) throw new Error('Staff member is required');
  if (!shift_date) throw new Date('Date is required');
  if (!start_time) throw new Error('Start time is required');
  if (!end_time) throw new Error('End time is required');

  await pool.execute(
    'INSERT INTO staff_shifts (staff_id, shift_date, start_time, end_time, break_minutes, notes) VALUES (?,?,?,?,?,?)',
    [staff_id, shift_date, start_time, end_time, break_minutes || 0, notes || null]
  );
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function updateShiftStatus(shiftId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const validStatuses = ['scheduled', 'completed', 'absent', 'leave'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');
  await pool.execute('UPDATE staff_shifts SET status = ? WHERE id = ?', [status, shiftId]);
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function deleteShift(shiftId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.execute('DELETE FROM staff_shifts WHERE id = ?', [shiftId]);
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function getLeave(filters?: { status?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  let query = `SELECT sl.*, s.full_name, s.position FROM staff_leave sl JOIN staff s ON sl.staff_id = s.id`;
  const params: string[] = [];

  if (filters?.status && filters.status !== 'all') {
    query += ' WHERE sl.status = ?';
    params.push(filters.status);
  }
  query += ' ORDER BY sl.created_at DESC LIMIT 50';

  const [rows] = await pool.execute(query, params);
  return rows as Array<Record<string, unknown>>;
}

export async function getLeaveStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [pending] = await pool.execute("SELECT COUNT(*) as c FROM staff_leave WHERE status='pending'") as [Array<Record<string, unknown>>, unknown];
  const [approved] = await pool.execute("SELECT COUNT(*) as c FROM staff_leave WHERE status='approved' AND MONTH(start_date) = MONTH(CURDATE())") as [Array<Record<string, unknown>>, unknown];
  return {
    pending: Number(pending[0]?.c ?? 0),
    approvedThisMonth: Number(approved[0]?.c ?? 0),
  };
}

export async function createLeave(data: {
  staff_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { staff_id, leave_type, start_date, end_date, reason, notes } = data;
  if (!staff_id) throw new Error('Staff member is required');
  if (!leave_type) throw new Error('Leave type is required');
  if (!start_date) throw new Error('Start date is required');
  if (!end_date) throw new Error('End date is required');

  const s = new Date(start_date);
  const e = new Date(end_date);
  const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  await pool.execute(
    'INSERT INTO staff_leave (staff_id, leave_type, start_date, end_date, days, reason, notes) VALUES (?,?,?,?,?,?,?)',
    [staff_id, leave_type, start_date, end_date, days, reason || null, notes || null]
  );
  revalidatePath('/staff/leave');
  return { success: true };
}

export async function updateLeave(leaveId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');
  await pool.execute('UPDATE staff_leave SET status=?, approved_by=? WHERE id=?', [status, user.id, leaveId]);
  revalidatePath('/staff/leave');
  return { success: true };
}

export async function createWage(data: {
  staff_id: number;
  amount: number;
  pay_date: string;
  payment_method: string;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { staff_id, amount, pay_date, payment_method, notes } = data;
  if (!staff_id) throw new Error('Staff member is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
  if (!pay_date) throw new Error('Pay date is required');

  await pool.execute(
    'INSERT INTO staff_wages (staff_id, amount, pay_date, payment_method, notes, created_by) VALUES (?,?,?,?,?,?)',
    [staff_id, amount, pay_date, payment_method || 'cash', notes || null, user.id]
  );

  const [staffRows] = await pool.execute('SELECT full_name FROM staff WHERE id = ?', [staff_id]) as [Array<Record<string, unknown>>, unknown];
  const staffName = staffRows[0]?.full_name ?? 'Staff';
  const dbMethod = payment_method === 'momo' ? 'mobile_money' : payment_method === 'airtel_money' ? 'mobile_money' : payment_method === 'bank' ? 'bank_transfer' : 'cash';
  const desc = `Wages - ${staffName}`;
  await pool.execute(
    "INSERT INTO financial_transactions (type, category, description, amount, payment_method, transaction_date, recorded_by) VALUES ('expense','wages',?,?,?,CURDATE(),?)",
    [desc, amount, dbMethod, user.id]
  );

  revalidatePath('/staff/wages');
  revalidatePath('/finance');
  return { success: true };
}

export async function getWages(filters?: { month?: string; method?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const month = filters?.month || new Date().toISOString().slice(0, 7);
  let query = 'SELECT sw.*, s.full_name, s.position FROM staff_wages sw JOIN staff s ON sw.staff_id = s.id WHERE DATE_FORMAT(sw.pay_date, \'%Y-%m\') = ?';
  const params: string[] = [month];

  if (filters?.method) {
    query += ' AND sw.payment_method = ?';
    params.push(filters.method);
  }
  query += ' ORDER BY sw.pay_date DESC';

  const [rows] = await pool.execute(query, params);
  return rows as Array<Record<string, unknown>>;
}

export async function getWageStats(month: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [totalPaid] = await pool.execute("SELECT COALESCE(SUM(amount),0) as t FROM staff_wages WHERE DATE_FORMAT(pay_date, '%Y-%m') = ?", [month]) as [Array<Record<string, unknown>>, unknown];
  const [staffCount] = await pool.execute("SELECT COUNT(DISTINCT staff_id) as c FROM staff_wages WHERE DATE_FORMAT(pay_date, '%Y-%m') = ?", [month]) as [Array<Record<string, unknown>>, unknown];
  const [methodStats] = await pool.execute("SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM staff_wages WHERE DATE_FORMAT(pay_date, '%Y-%m') = ? GROUP BY payment_method", [month]) as [Array<Record<string, unknown>>, unknown];
  return {
    totalPaid: Number(totalPaid[0]?.t ?? 0),
    staffCount: Number(staffCount[0]?.c ?? 0),
    methodStats: methodStats as Array<Record<string, unknown>>,
  };
}
