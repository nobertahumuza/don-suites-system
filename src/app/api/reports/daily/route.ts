import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().slice(0, 10);

    const [
      occupancyData,
      revenueData,
      expenseData,
      fbData,
      newGuests,
      checkinsToday,
      checkoutsToday,
      incidentsToday,
      openIncidents,
      visitorsToday,
      parkedCount,
      parkingRevenue,
    ] = await Promise.all([
      prisma.$queryRawUnsafe<
        { room_type: string; total_rooms: number; total_bookings: bigint; currently_occupied: bigint; occupancy_rate: number }[]
      >(
        `SELECT rt.name as room_type, rt.total_rooms,
         COUNT(DISTINCT b.id) as total_bookings,
         SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as currently_occupied,
         CASE WHEN rt.total_rooms > 0 THEN ROUND(SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) * 100.0 / rt.total_rooms, 1) ELSE 0 END as occupancy_rate
         FROM room_types rt
         LEFT JOIN rooms r ON r.room_type_id = rt.id
         LEFT JOIN bookings b ON b.room_id = r.id
             AND ((b.check_in_date <= $1::date AND b.check_out_date >= $1::date))
             AND b.status IN ('confirmed','checked_in','checked_out','completed')
         GROUP BY rt.id, rt.name, rt.total_rooms ORDER BY rt.name`,
        todayStr
      ),
      prisma.financial_transactions.groupBy({
        by: ['category'],
        where: { type: 'income', transaction_date: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.financial_transactions.groupBy({
        by: ['category'],
        where: { type: 'expense', transaction_date: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.fb_orders.groupBy({
        by: ['order_type', 'payment_status'],
        where: { created_at: { gte: today, lt: tomorrow } },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
      }),
      prisma.guests.count({
        where: { created_at: { gte: today, lt: tomorrow } },
      }),
      prisma.bookings.count({
        where: {
          check_in_date: today,
          status: { in: ['confirmed', 'checked_in'] },
        },
      }),
      prisma.bookings.count({
        where: {
          check_out_date: today,
          status: { in: ['checked_out', 'completed'] },
        },
      }),
      prisma.security_incidents.count({
        where: { created_at: { gte: today, lt: tomorrow } },
      }),
      prisma.security_incidents.count({
        where: { status: 'open' },
      }),
      prisma.visitor_log.count({
        where: { time_in: { gte: today, lt: tomorrow } },
      }),
      prisma.vehicle_parking.count({
        where: { status: 'parked' },
      }),
      prisma.vehicle_parking.aggregate({
        _sum: { total_charge: true },
        where: {
          created_at: { gte: today, lt: tomorrow },
          status: 'checked_out',
        },
      }),
    ]);

    const totalRooms = occupancyData.reduce((s, r) => s + Number(r.total_rooms), 0);
    const totalOccupied = occupancyData.reduce((s, r) => s + Number(r.currently_occupied), 0);
    const occRate = totalRooms > 0 ? Math.round((totalOccupied * 100) / totalRooms * 10) / 10 : 0;

    const totalIncome = revenueData.reduce((s, r) => s + Number(r._sum.amount || 0), 0);
    const totalExpenses = expenseData.reduce((s, r) => s + Number(r._sum.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    const fbTotalOrders = fbData.reduce((s, r) => s + r._count, 0);
    const fbTotalRevenue = fbData.reduce((s, r) => s + Number(r._sum.total || 0), 0);
    const fbUnpaid = fbData
      .filter(r => r.payment_status === 'unpaid')
      .reduce((s, r) => s + Number(r._sum.total || 0), 0);

    return NextResponse.json({
      occupancy: {
        roomTypes: occupancyData,
        totalRooms,
        totalOccupied,
        occupancyRate: occRate,
      },
      revenue: {
        income: revenueData,
        expenses: expenseData,
        totalIncome,
        totalExpenses,
        netProfit,
      },
      fb: {
        orders: fbData,
        totalOrders: fbTotalOrders,
        totalRevenue: fbTotalRevenue,
        unpaid: fbUnpaid,
      },
      guests: {
        newGuests,
        checkinsToday,
        checkoutsToday,
      },
      security: {
        incidentsToday,
        openIncidents,
        visitorsToday,
      },
      parking: {
        currentlyParked: parkedCount,
        todayRevenue: Number(parkingRevenue._sum.total_charge || 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
