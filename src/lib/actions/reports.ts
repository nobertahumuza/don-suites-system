'use server';

import prisma from '@/lib/db';

export async function getOccupancyReport() {
  const roomTypes = await prisma.room_types.findMany({
    include: {
      rooms: {
        include: {
          _count: { select: { bookings: { where: { status: 'checked_in' } } } },
        },
      },
    },
  });

  const totalRooms = await prisma.rooms.count();
  const occupiedRooms = await prisma.rooms.count({ where: { status: 'occupied' } });
  const availableRooms = await prisma.rooms.count({ where: { status: 'available' } });
  const reservedRooms = await prisma.rooms.count({ where: { status: 'reserved' } });
  const cleaningRooms = await prisma.rooms.count({ where: { status: 'cleaning' } });
  const outOfServiceRooms = await prisma.rooms.count({ where: { status: 'out_of_service' } });

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentBookings = await prisma.bookings.count({
    where: {
      check_in_date: { gte: thirtyDaysAgo },
      status: { in: ['checked_in', 'checked_out', 'confirmed'] },
    },
  });

  const historicalOccupancy = recentBookings > 0
    ? Math.round((recentBookings / (totalRooms * 30)) * 100)
    : 0;

  const byType = roomTypes.map((rt) => ({
    name: rt.name,
    total: rt.rooms.length,
    occupied: rt.rooms.filter((r) => r.status === 'occupied').length,
    available: rt.rooms.filter((r) => r.status === 'available').length,
    price: Number(rt.price),
  }));

  return {
    summary: {
      totalRooms,
      occupiedRooms,
      availableRooms,
      reservedRooms,
      cleaningRooms,
      outOfServiceRooms,
      currentOccupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      historicalOccupancy,
    },
    byType,
  };
}

export async function getFinancialSummary(startDate?: string, endDate?: string) {
  const where: Record<string, unknown> = {};
  if (startDate) where.transaction_date = { gte: new Date(startDate) };
  if (endDate && startDate) where.transaction_date = { gte: new Date(startDate), lte: new Date(endDate) };
  else if (endDate) where.transaction_date = { lte: new Date(endDate) };

  const transactions = await prisma.financial_transactions.findMany({
    where,
    orderBy: { transaction_date: 'desc' },
  });

  const income = transactions.filter((t) => t.type === 'income');
  const expense = transactions.filter((t) => t.type === 'expense');

  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expense.reduce((sum, t) => sum + Number(t.amount), 0);

  const incomeByCategory = income.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const expenseByCategory = expense.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const recentTransactions = transactions.slice(0, 20).map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: Number(t.amount),
    payment_method: t.payment_method,
    transaction_date: t.transaction_date.toISOString().split('T')[0],
  }));

  return {
    summary: {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      transactionCount: transactions.length,
    },
    incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({ category, amount })),
    expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
    recentTransactions,
  };
}

export async function getBookingReport() {
  const totalBookings = await prisma.bookings.count();
  const activeBookings = await prisma.bookings.count({
    where: { status: { in: ['pending', 'confirmed', 'checked_in'] } },
  });
  const completedBookings = await prisma.bookings.count({ where: { status: 'checked_out' } });
  const cancelledBookings = await prisma.bookings.count({ where: { status: 'cancelled' } });

  const bookings = await prisma.bookings.findMany({
    select: {
      total_amount: true,
      amount_paid: true,
      status: true,
      check_in_date: true,
      nights: true,
    },
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalCollected = bookings.reduce((sum, b) => sum + Number(b.amount_paid || 0), 0);
  const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const averageStay = bookings.length > 0
    ? Math.round(bookings.reduce((sum, b) => sum + (b.nights || 0), 0) / bookings.length)
    : 0;

  const monthlyBookings: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const month = b.check_in_date.toISOString().slice(0, 7);
    if (!monthlyBookings[month]) monthlyBookings[month] = { count: 0, revenue: 0 };
    monthlyBookings[month].count++;
    monthlyBookings[month].revenue += Number(b.total_amount);
  });

  return {
    summary: {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      totalCollected,
      outstandingBalance: totalRevenue - totalCollected,
      averageBookingValue,
      averageStay,
    },
    monthlyTrend: Object.entries(monthlyBookings)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6),
  };
}

export async function getStaffReport() {
  const totalStaff = await prisma.staff.count();
  const activeStaff = await prisma.staff.count({ where: { status: 'active' } });

  const departments = await prisma.staff.groupBy({
    by: ['department'],
    _count: { id: true },
    where: { status: 'active' },
    orderBy: { _count: { id: 'desc' } },
  });

  const leaveStats = await prisma.staff_leave.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const recentLeave = await prisma.staff_leave.findMany({
    take: 10,
    include: { staff: { select: { full_name: true, department: true } } },
    orderBy: { created_at: 'desc' },
  });

  return {
    summary: {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
    },
    byDepartment: departments.map((d) => ({
      department: d.department || 'Unassigned',
      count: d._count.id,
    })),
    leaveStats: leaveStats.map((l) => ({
      status: l.status || 'pending',
      count: l._count.id,
    })),
    recentLeave: recentLeave.map((l) => ({
      id: l.id,
      staff_name: l.staff?.full_name || 'N/A',
      department: l.staff?.department || 'N/A',
      leave_type: l.leave_type,
      start_date: l.start_date.toISOString().split('T')[0],
      end_date: l.end_date.toISOString().split('T')[0],
      days: l.days,
      status: l.status,
    })),
  };
}
