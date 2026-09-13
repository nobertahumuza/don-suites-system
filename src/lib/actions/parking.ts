'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getParkingStats() {
  const [parkedCount] = await pool.execute("SELECT COUNT(*) as c FROM vehicle_parking WHERE status='parked'");
  const [todayCount] = await pool.execute("SELECT COUNT(*) as c FROM vehicle_parking WHERE DATE(check_in) = CURDATE()");
  const [todayRevenue] = await pool.execute("SELECT COALESCE(SUM(total_charge),0) as c FROM vehicle_parking WHERE DATE(check_out) = CURDATE() AND total_charge > 0");

  return {
    parkedCount: (parkedCount as any[])[0].c,
    todayCount: (todayCount as any[])[0].c,
    todayRevenue: (todayRevenue as any[])[0].c,
  };
}

export async function getParkingRecords(filter: string = 'parked') {
  let query = '';
  if (filter === 'parked') {
    query = `SELECT vp.*, g.full_name as guest_name FROM vehicle_parking vp LEFT JOIN guests g ON vp.guest_id = g.id WHERE vp.status = 'parked' ORDER BY vp.check_in DESC`;
  } else if (filter === 'departed') {
    query = `SELECT vp.*, g.full_name as guest_name FROM vehicle_parking vp LEFT JOIN guests g ON vp.guest_id = g.id WHERE vp.status = 'departed' ORDER BY vp.check_out DESC LIMIT 50`;
  } else {
    query = `SELECT vp.*, g.full_name as guest_name FROM vehicle_parking vp LEFT JOIN guests g ON vp.guest_id = g.id ORDER BY vp.created_at DESC LIMIT 50`;
  }

  const [rows] = await pool.execute(query);
  return rows as any[];
}

export async function getGuests() {
  const [rows] = await pool.execute('SELECT id, full_name, phone FROM guests ORDER BY full_name');
  return rows as any[];
}

export async function checkInVehicle(data: {
  plate_number: string;
  vehicle_type: string;
  vehicle_make: string;
  color: string;
  owner_name: string;
  owner_phone: string;
  guest_id?: number;
  parking_spot: string;
  parking_rate: number;
  notes?: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const { plate_number, vehicle_type, vehicle_make, color, owner_name, owner_phone, guest_id, parking_spot, parking_rate, notes } = data;

  if (!plate_number) throw new Error('Plate number is required');
  if (!owner_name) throw new Error('Owner name is required');
  if (!parking_spot) throw new Error('Parking spot is required');

  await pool.execute(
    `INSERT INTO vehicle_parking (plate_number, vehicle_type, vehicle_make, color, owner_name, owner_phone, guest_id, parking_spot, check_in, parking_rate, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
    [plate_number.toUpperCase(), vehicle_type || 'sedan', vehicle_make || '', color || '', owner_name, owner_phone || '', guest_id || null, parking_spot, parking_rate || 5000, notes || '', user.id]
  );

  revalidatePath('/parking');
  return { success: true };
}

export async function checkOutVehicle(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const [vehicleRows] = await pool.execute('SELECT * FROM vehicle_parking WHERE id = ? AND status = ?', [id, 'parked']);
  const vehicles = vehicleRows as any[];
  if (vehicles.length === 0) throw new Error('Vehicle not found or already checked out');

  const v = vehicles[0];
  let charge = 0;
  if (v.parking_rate > 0) {
    const ci = new Date(v.check_in);
    const co = new Date();
    let hours = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60));
    if (hours < 1) hours = 1;
    charge = v.parking_rate * hours;
  }

  await pool.execute(
    "UPDATE vehicle_parking SET status='departed', check_out=NOW(), total_charge=? WHERE id=? AND status='parked'",
    [charge, id]
  );

  revalidatePath('/parking');
  return { success: true };
}

export async function deleteParkingRecord(id: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  await pool.execute('DELETE FROM vehicle_parking WHERE id = ?', [id]);
  revalidatePath('/parking');
  return { success: true };
}
