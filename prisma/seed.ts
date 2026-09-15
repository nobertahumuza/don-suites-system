import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Prisma...');

  // Users (passwords are bcrypt hashes)
  const adminHash = await bcrypt.hash('admin123', 10);
  const receptionHash = await bcrypt.hash('reception123', 10);
  const storekeeperHash = await bcrypt.hash('store123', 10);
  const securityHash = await bcrypt.hash('security123', 10);

  const users = [
    { username: 'admin', password: adminHash, full_name: 'Administrator', role: 'admin' },
    { username: 'reception', password: receptionHash, full_name: 'Receptionist', role: 'reception' },
    { username: 'storekeeper', password: storekeeperHash, full_name: 'Storekeeper', role: 'storekeeper' },
    { username: 'security', password: securityHash, full_name: 'Security Guard', role: 'security' },
  ];
  for (const u of users) {
    await prisma.users.upsert({ where: { username: u.username }, update: {}, create: u });
  }
  console.log('  Users: 4');

  // Room Types
  const roomTypes = [
    { name: 'Single', price: 150000, total_rooms: 5, description: 'Single bed room', cooking_space_price: 0 },
    { name: 'Double', price: 250000, total_rooms: 5, description: 'Double bed room', cooking_space_price: 50000 },
    { name: 'Suite', price: 450000, total_rooms: 4, description: 'Premium suite', cooking_space_price: 100000 },
    { name: 'Deluxe', price: 650000, total_rooms: 3, description: 'Deluxe room with kitchen', cooking_space_price: 150000 },
  ];
  for (const rt of roomTypes) {
    await prisma.room_types.create({ data: rt });
  }
  console.log('  Room Types: 4');

  // Rooms
  const roomsData = [
    { room_number: 'R101', room_type_id: 1, status: 'available' },
    { room_number: 'R102', room_type_id: 1, status: 'occupied' },
    { room_number: 'R103', room_type_id: 1, status: 'available' },
    { room_number: 'R104', room_type_id: 1, status: 'cleaning' },
    { room_number: 'R105', room_type_id: 1, status: 'available' },
    { room_number: 'R201', room_type_id: 2, status: 'occupied' },
    { room_number: 'R202', room_type_id: 2, status: 'available' },
    { room_number: 'R203', room_type_id: 2, status: 'available' },
    { room_number: 'R204', room_type_id: 2, status: 'occupied' },
    { room_number: 'R205', room_type_id: 2, status: 'available' },
    { room_number: 'R301', room_type_id: 3, status: 'available' },
    { room_number: 'R302', room_type_id: 3, status: 'occupied' },
    { room_number: 'R303', room_type_id: 3, status: 'available' },
    { room_number: 'R304', room_type_id: 3, status: 'out_of_service' },
    { room_number: 'R401', room_type_id: 4, status: 'available' },
    { room_number: 'R402', room_type_id: 4, status: 'occupied' },
    { room_number: 'R403', room_type_id: 4, status: 'available' },
  ];
  for (const r of roomsData) {
    await prisma.rooms.upsert({ where: { room_number: r.room_number }, update: {}, create: r });
  }
  console.log('  Rooms: 17');

  // Staff
  const staffData = [
    { full_name: 'Grace Nakamya', gender: 'female', phone: '+256701234567', email: 'grace@don-suites.com', position: 'Front Desk Officer', department: 'Reception', contract_type: 'permanent', wage: 800000, hire_date: new Date('2023-01-15') },
    { full_name: 'James Okello', gender: 'male', phone: '+256702345678', email: 'james@don-suites.com', position: 'Head Chef', department: 'Kitchen', contract_type: 'permanent', wage: 1200000, hire_date: new Date('2022-06-01') },
    { full_name: 'Sarah Achieng', gender: 'female', phone: '+256703456789', email: 'sarah@don-suites.com', position: 'Housekeeper', department: 'Housekeeping', contract_type: 'contract', wage: 450000, hire_date: new Date('2024-03-10') },
    { full_name: 'David Mugisha', gender: 'male', phone: '+256704567890', email: 'david@don-suites.com', position: 'Security Guard', department: 'Security', contract_type: 'permanent', wage: 600000, hire_date: new Date('2023-09-01') },
    { full_name: 'Fatima Nansubuga', gender: 'female', phone: '+256705678901', email: 'fatima@don-suites.com', position: 'Accountant', department: 'Finance', contract_type: 'permanent', wage: 1000000, hire_date: new Date('2022-11-15') },
    { full_name: 'Peter Ssempijja', gender: 'male', phone: '+256706789012', email: 'peter@don-suites.com', position: 'Waiter', department: 'Restaurant', contract_type: 'contract', wage: 400000, hire_date: new Date('2024-06-01') },
    { full_name: 'Esther Kabanda', gender: 'female', phone: '+256707890123', email: 'esther@don-suites.com', position: 'Receptionist', department: 'Reception', contract_type: 'permanent', wage: 750000, hire_date: new Date('2023-04-20') },
    { full_name: 'Moses Bukenya', gender: 'male', phone: '+256708901234', email: 'moses@don-suites.com', position: 'Maintenance', department: 'Facilities', contract_type: 'contract', wage: 500000, hire_date: new Date('2024-01-10') },
  ];
  for (const s of staffData) {
    await prisma.staff.create({ data: s });
  }
  console.log('  Staff: 8');

  // F&B Categories & Items
  const fbCats = ['Main Course', 'Drinks', 'Snacks', 'Breakfast', 'Desserts'];
  for (const c of fbCats) {
    await prisma.fb_categories.create({ data: { name: c } });
  }
  const fbItems = [
    { name: 'Grilled Chicken', category: 'Main Course', price: 35000, stock_quantity: 20 },
    { name: 'Beef Stew', category: 'Main Course', price: 30000, stock_quantity: 15 },
    { name: 'Fish & Chips', category: 'Main Course', price: 40000, stock_quantity: 12 },
    { name: 'Rice & Beans', category: 'Main Course', price: 20000, stock_quantity: 25 },
    { name: 'Rolex', category: 'Breakfast', price: 8000, stock_quantity: 50 },
    { name: 'Chapati & Eggs', category: 'Breakfast', price: 12000, stock_quantity: 40 },
    { name: 'Fruit Salad', category: 'Breakfast', price: 15000, stock_quantity: 20 },
    { name: 'Soda', category: 'Drinks', price: 5000, stock_quantity: 100 },
    { name: 'Fresh Juice', category: 'Drinks', price: 10000, stock_quantity: 30 },
    { name: 'Milkshake', category: 'Drinks', price: 15000, stock_quantity: 25 },
    { name: 'Samosa', category: 'Snacks', price: 5000, stock_quantity: 40 },
    { name: 'Spring Rolls', category: 'Snacks', price: 8000, stock_quantity: 30 },
    { name: 'Mandazi', category: 'Snacks', price: 3000, stock_quantity: 50 },
    { name: 'Cake Slice', category: 'Desserts', price: 12000, stock_quantity: 15 },
    { name: 'Ice Cream', category: 'Desserts', price: 10000, stock_quantity: 20 },
  ];
  const cats = await prisma.fb_categories.findMany();
  const catMap = new Map(cats.map(c => [c.name, c.id]));
  for (const item of fbItems) {
    const catId = catMap.get(item.category);
    if (catId) {
      await prisma.fb_items.create({ data: { name: item.name, category_id: catId, category: item.category, price: item.price, stock_quantity: item.stock_quantity, status: 'active' } });
    }
  }
  console.log('  F&B: 5 categories, 15 items');

  // Inventory
  const invCats = ['Cleaning Supplies', 'Kitchen Supplies', 'Office Supplies', 'Linens', 'Toiletries'];
  for (const c of invCats) {
    await prisma.inventory_categories.create({ data: { name: c } });
  }
  const invItems = [
    { name: 'Dish Soap', cat: 'Cleaning Supplies', qty: 50, unit: 'liters', reorder: 20 },
    { name: 'Floor Cleaner', cat: 'Cleaning Supplies', qty: 30, unit: 'liters', reorder: 15 },
    { name: 'Bleach', cat: 'Cleaning Supplies', qty: 25, unit: 'liters', reorder: 10 },
    { name: 'Cooking Oil', cat: 'Kitchen Supplies', qty: 40, unit: 'liters', reorder: 15 },
    { name: 'Salt', cat: 'Kitchen Supplies', qty: 20, unit: 'kg', reorder: 5 },
    { name: 'Bath Towels', cat: 'Linens', qty: 100, unit: 'piece', reorder: 30 },
    { name: 'Bed Sheets', cat: 'Linens', qty: 60, unit: 'piece', reorder: 20 },
    { name: 'Shampoo', cat: 'Toiletries', qty: 80, unit: 'bottle', reorder: 25 },
    { name: 'Soap Bars', cat: 'Toiletries', qty: 120, unit: 'piece', reorder: 40 },
    { name: 'A4 Paper', cat: 'Office Supplies', qty: 20, unit: 'ream', reorder: 5 },
  ];
  const invCatsDb = await prisma.inventory_categories.findMany();
  const invCatMap = new Map(invCatsDb.map(c => [c.name, c.id]));
  for (const item of invItems) {
    const catId = invCatMap.get(item.cat);
    if (catId) {
      await prisma.inventory_items.create({ data: { name: item.name, category_id: catId, quantity_in_stock: item.qty, unit: item.unit, reorder_level: item.reorder, status: 'active' } });
    }
  }
  console.log('  Inventory: 5 categories, 10 items');

  // Guests
  const guestsData = [
    { full_name: 'John Mukisa', phone: '+256711111111', email: 'john@email.com', sex: 'male', nationality: 'Ugandan', registered_by: 1 },
    { full_name: 'Mary Johnson', phone: '+256722222222', email: 'mary@email.com', sex: 'female', nationality: 'Kenyan', registered_by: 1 },
    { full_name: 'Robert Kimani', phone: '+256733333333', email: 'robert@email.com', sex: 'male', nationality: 'Kenyan', registered_by: 1 },
    { full_name: 'Sarah Williams', phone: '+256744444444', email: 'sarah@email.com', sex: 'female', nationality: 'British', registered_by: 1 },
    { full_name: 'David Okello', phone: '+256755555555', email: 'david@email.com', sex: 'male', nationality: 'Ugandan', registered_by: 1 },
  ];
  for (const g of guestsData) {
    await prisma.guests.create({ data: g });
  }
  console.log('  Guests: 5');

  // Bookings
  const today = new Date();
  const co1 = new Date(today.getTime() + 3 * 86400000);
  const co2 = new Date(today.getTime() + 2 * 86400000);
  const co3 = new Date(today.getTime() + 5 * 86400000);
  await prisma.bookings.create({ data: { guest_id: 1, room_id: 2, check_in_date: today, check_out_date: co1, total_amount: 750000, amount_paid: 500000, deposit_amount: 200000, deposit_paid: 200000, status: 'checked_in', payment_status: 'paid', nights: 3, created_by: 1 } });
  await prisma.bookings.create({ data: { guest_id: 2, room_id: 6, check_in_date: today, check_out_date: co2, total_amount: 500000, amount_paid: 250000, deposit_amount: 100000, deposit_paid: 100000, status: 'checked_in', payment_status: 'pending', nights: 2, created_by: 1 } });
  await prisma.bookings.create({ data: { guest_id: 3, room_id: 12, check_in_date: co1, check_out_date: co3, total_amount: 1350000, amount_paid: 1350000, status: 'confirmed', payment_status: 'paid', nights: 3, created_by: 1 } });
  console.log('  Bookings: 3');

  // F&B Orders
  await prisma.fb_orders.create({ data: { booking_id: 1, guest_id: 1, guest_name: 'John Mukisa', room_number: 'R102', order_type: 'room_service', subtotal: 45000, total: 45000, payment_status: 'paid', status: 'served', served_by: 1 } });
  await prisma.fb_orders.create({ data: { booking_id: 2, guest_id: 2, guest_name: 'Mary Johnson', room_number: 'R201', order_type: 'dine_in', subtotal: 30000, total: 30000, payment_status: 'unpaid', status: 'pending', served_by: 1 } });
  console.log('  F&B Orders: 2');

  // Financial Transactions
  await prisma.financial_transactions.create({ data: { type: 'income', category: 'Room', description: 'Booking payment - John Mukisa', amount: 500000, payment_method: 'mobile_money', transaction_date: today, recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'income', category: 'Room', description: 'Deposit - Mary Johnson', amount: 100000, payment_method: 'cash', transaction_date: today, recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'income', category: 'F&B', description: 'Room service - John Mukisa', amount: 45000, payment_method: 'mobile_money', transaction_date: new Date(today.getTime() - 86400000), recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'expense', category: 'Supplies', description: 'Cleaning supplies purchase', amount: 150000, payment_method: 'cash', transaction_date: new Date(today.getTime() - 86400000), recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'income', category: 'Room', description: 'Booking - Robert Kimani', amount: 1350000, payment_method: 'bank', transaction_date: new Date(today.getTime() - 2 * 86400000), recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'expense', category: 'Salaries', description: 'Staff wages', amount: 4500000, payment_method: 'bank', transaction_date: new Date(today.getTime() - 2 * 86400000), recorded_by: 1 } });
  await prisma.financial_transactions.create({ data: { type: 'income', category: 'Conference', description: 'Hall booking - Wedding', amount: 2000000, payment_method: 'bank', transaction_date: new Date(today.getTime() - 2 * 86400000), recorded_by: 1 } });
  console.log('  Financial transactions: 7');

  // Security Incidents
  await prisma.security_incidents.create({ data: { incident_type: 'Theft Report', severity: 'medium', location: 'Parking Area', description: 'Guest reported missing side mirror', reported_by: 'David Mugisha', status: 'open' } });
  await prisma.security_incidents.create({ data: { incident_type: 'Fire Alarm', severity: 'low', location: 'Kitchen', description: 'Smoke detector triggered during cooking', reported_by: 'James Okello', status: 'resolved' } });
  console.log('  Security incidents: 2');

  // Visitor Log
  await prisma.visitor_log.create({ data: { visitor_name: 'Alice Nabukera', visitor_phone: '+256799999999', purpose: 'Business meeting', visiting_guest: 'John Mukisa', room_number: 'R102', time_in: new Date(), logged_by: 4 } });
  console.log('  Visitor log: 1');

  console.log('\nSeeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
