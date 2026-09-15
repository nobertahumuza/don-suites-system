'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  return prisma.users.findMany({
    orderBy: [{ role: 'asc' }, { full_name: 'asc' }],
  });
}

export async function toggleUserStatus(userId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const current = await prisma.users.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!current) throw new Error('User not found');
  const newStatus = current.status === 'active' ? 'inactive' : 'active';
  await prisma.users.update({
    where: { id: userId },
    data: { status: newStatus },
  });
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
  await prisma.users.update({
    where: { id: userId },
    data: { password: hashed },
  });
  revalidatePath('/staff/users');
  return { success: true };
}

export async function getStaff(filters?: { status?: string; search?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const where: Record<string, unknown> = {};
  if (filters?.status && ['active', 'inactive'].includes(filters.status)) {
    where.status = filters.status;
  }
  if (filters?.search) {
    const s = filters.search;
    where.OR = [
      { full_name: { contains: s, mode: 'insensitive' } },
      { position: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
    ];
  }
  return prisma.staff.findMany({
    where,
    orderBy: { full_name: 'asc' },
  });
}

export async function getStaffStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [total, active, inactive, wagesSum] = await Promise.all([
    prisma.staff.count(),
    prisma.staff.count({ where: { status: 'active' } }),
    prisma.staff.count({ where: { status: 'inactive' } }),
    prisma.staff.aggregate({
      _sum: { wage: true },
      where: { status: 'active' },
    }),
  ]);
  return {
    total,
    active,
    inactive,
    totalWages: Number(wagesSum._sum.wage ?? 0),
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
  await prisma.staff.create({
    data: {
      full_name,
      gender: gender || null,
      phone: phone || null,
      email: email || null,
      position,
      department: department || null,
      contract_type: contract_type || 'permanent',
      wage: wage || 0,
      hire_date: hire_date ? new Date(hire_date) : null,
      status: status || 'active',
    },
  });
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
  await prisma.staff.update({
    where: { id: staffId },
    data: {
      full_name,
      gender: gender || null,
      phone: phone || null,
      email: email || null,
      position,
      department: department || null,
      contract_type: contract_type || 'permanent',
      wage: wage || 0,
      hire_date: hire_date ? new Date(hire_date) : null,
      status: status || 'active',
    },
  });
  revalidatePath('/staff');
  return { success: true };
}

export async function deleteStaff(staffId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await prisma.staff.delete({ where: { id: staffId } });
  revalidatePath('/staff');
  return { success: true };
}

export async function getShifts(filters?: { week_start?: string; week_end?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const where: Record<string, unknown> = {};
  if (filters?.week_start && filters?.week_end) {
    where.shift_date = {
      gte: new Date(filters.week_start),
      lte: new Date(filters.week_end),
    };
  }
  return prisma.staff_shifts.findMany({
    where,
    include: { staff: { select: { full_name: true, position: true } } },
    orderBy: [{ shift_date: 'asc' }, { start_time: 'asc' }],
  });
}

export async function getActiveStaffList() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  return prisma.staff.findMany({
    where: { status: 'active' },
    select: { id: true, full_name: true, position: true },
    orderBy: { full_name: 'asc' },
  });
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
  if (!shift_date) throw new Error('Date is required');
  if (!start_time) throw new Error('Start time is required');
  if (!end_time) throw new Error('End time is required');
  await prisma.staff_shifts.create({
    data: {
      staff_id,
      shift_date: new Date(shift_date),
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      break_minutes: break_minutes || 0,
      notes: notes || null,
      created_by: user.id,
    },
  });
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function updateShiftStatus(shiftId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const validStatuses = ['scheduled', 'completed', 'absent', 'leave'];
  if (!validStatuses.includes(status)) throw new Error('Invalid status');
  await prisma.staff_shifts.update({
    where: { id: shiftId },
    data: { status },
  });
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function deleteShift(shiftId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await prisma.staff_shifts.delete({ where: { id: shiftId } });
  revalidatePath('/staff/shifts');
  return { success: true };
}

export async function getLeave(filters?: { status?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status;
  }
  return prisma.staff_leave.findMany({
    where,
    include: { staff: { select: { full_name: true, position: true } } },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}

export async function getLeaveStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [pending, approvedThisMonth] = await Promise.all([
    prisma.staff_leave.count({ where: { status: 'pending' } }),
    prisma.staff_leave.count({
      where: {
        status: 'approved',
        start_date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);
  return { pending, approvedThisMonth };
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
  await prisma.staff_leave.create({
    data: {
      staff_id,
      leave_type,
      start_date: s,
      end_date: e,
      days,
      reason: reason || null,
      notes: notes || null,
    },
  });
  revalidatePath('/staff/leave');
  return { success: true };
}

export async function updateLeave(leaveId: number, status: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid status');
  await prisma.staff_leave.update({
    where: { id: leaveId },
    data: { status, approved_by: user.id },
  });
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
  await prisma.staff_wages.create({
    data: {
      staff_id,
      amount,
      pay_date: new Date(pay_date),
      payment_method: payment_method || 'cash',
      notes: notes || null,
      created_by: user.id,
    },
  });
  const staffRecord = await prisma.staff.findUnique({
    where: { id: staff_id },
    select: { full_name: true },
  });
  const staffName = staffRecord?.full_name ?? 'Staff';
  const dbMethod = payment_method === 'momo' ? 'mobile_money' : payment_method === 'airtel_money' ? 'mobile_money' : payment_method === 'bank' ? 'bank_transfer' : 'cash';
  const desc = `Wages - ${staffName}`;
  await prisma.financial_transactions.create({
    data: {
      type: 'expense',
      category: 'wages',
      description: desc,
      amount,
      payment_method: dbMethod,
      transaction_date: new Date(),
      recorded_by: user.id,
    },
  });
  revalidatePath('/staff/wages');
  revalidatePath('/finance');
  return { success: true };
}

export async function getWages(filters?: { month?: string; method?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const month = filters?.month || new Date().toISOString().slice(0, 7);
  const [year, mon] = month.split('-').map(Number);
  const startOfMonth = new Date(year, mon - 1, 1);
  const endOfMonth = new Date(year, mon, 0, 23, 59, 59);
  const where: Record<string, unknown> = {
    pay_date: { gte: startOfMonth, lte: endOfMonth },
  };
  if (filters?.method) {
    where.payment_method = filters.method;
  }
  return prisma.staff_wages.findMany({
    where,
    include: { staff: { select: { full_name: true, position: true } } },
    orderBy: { pay_date: 'desc' },
  });
}

export async function getWageStats(month: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [year, mon] = month.split('-').map(Number);
  const startOfMonth = new Date(year, mon - 1, 1);
  const endOfMonth = new Date(year, mon, 0, 23, 59, 59);
  const where = { pay_date: { gte: startOfMonth, lte: endOfMonth } };
  const [totalPaidAgg, staffCount, methodStats] = await Promise.all([
    prisma.staff_wages.aggregate({ _sum: { amount: true }, where }),
    prisma.staff_wages.findMany({
      where,
      select: { staff_id: true },
      distinct: ['staff_id'],
    }),
    prisma.staff_wages.groupBy({
      by: ['payment_method'],
      _count: true,
      _sum: { amount: true },
      where,
    }),
  ]);
  return {
    totalPaid: Number(totalPaidAgg._sum.amount ?? 0),
    staffCount: staffCount.length,
    methodStats,
  };
}
