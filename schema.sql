-- Hotel Management System - PostgreSQL Schema
-- For Vercel deployment with Neon

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'reception' CHECK (role IN ('admin','reception','storekeeper','security')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  photo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Room Types
-- ============================================================
CREATE TABLE IF NOT EXISTS room_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  total_rooms INT DEFAULT 0,
  description TEXT DEFAULT NULL,
  cooking_space_price DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type_id INT NOT NULL REFERENCES room_types(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning','out_of_service')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Guests
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  sex VARCHAR(10) DEFAULT NULL,
  age INT DEFAULT NULL,
  id_type VARCHAR(20) DEFAULT 'national_id',
  id_number VARCHAR(50) DEFAULT NULL,
  nationality VARCHAR(50) DEFAULT NULL,
  vehicle_number VARCHAR(20) DEFAULT NULL,
  registered_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  guest_id INT REFERENCES guests(id),
  room_id INT REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMP DEFAULT NULL,
  actual_check_out TIMESTAMP DEFAULT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  deposit_amount DECIMAL(12,2) DEFAULT 0.00,
  deposit_paid DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT DEFAULT NULL,
  discount_id INT DEFAULT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  nights INT DEFAULT 1,
  additional_charges DECIMAL(12,2) DEFAULT 0.00,
  discount DECIMAL(12,2) DEFAULT 0.00,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- F&B Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS fb_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- F&B Items
-- ============================================================
CREATE TABLE IF NOT EXISTS fb_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  category_id INT REFERENCES fb_categories(id) ON DELETE SET NULL,
  category VARCHAR(50) DEFAULT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- F&B Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS fb_orders (
  id SERIAL PRIMARY KEY,
  booking_id INT REFERENCES bookings(id),
  guest_id INT REFERENCES guests(id),
  guest_name VARCHAR(100) DEFAULT NULL,
  room_number VARCHAR(10) DEFAULT NULL,
  order_type VARCHAR(20) DEFAULT 'dine_in',
  room_service_surcharge DECIMAL(12,2) DEFAULT 0.00,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_id INT DEFAULT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending',
  served_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- F&B Order Items
-- ============================================================
CREATE TABLE IF NOT EXISTS fb_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES fb_orders(id) ON DELETE CASCADE,
  fb_item_id INT NOT NULL REFERENCES fb_items(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Financial Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  transaction_date DATE NOT NULL,
  recorded_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Expense Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Conference Halls
-- ============================================================
CREATE TABLE IF NOT EXISTS conference_halls (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT NULL,
  price_per_day DECIMAL(12,2) NOT NULL,
  type VARCHAR(50) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'available',
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Conference Bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS conference_bookings (
  id SERIAL PRIMARY KEY,
  hall_id INT NOT NULL REFERENCES conference_halls(id),
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  event_date DATE NOT NULL,
  event_type VARCHAR(100) DEFAULT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  purpose VARCHAR(255) DEFAULT NULL,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Garden Bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS garden_bookings (
  id SERIAL PRIMARY KEY,
  guest_id INT DEFAULT NULL,
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  event_date DATE NOT NULL,
  event_type VARCHAR(100) DEFAULT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  purpose VARCHAR(255) DEFAULT NULL,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Camping Bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS camping_bookings (
  id SERIAL PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  num_guests INT DEFAULT 1,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PA Hires
-- ============================================================
CREATE TABLE IF NOT EXISTS pa_hires (
  id SERIAL PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20) DEFAULT NULL,
  equipment VARCHAR(255) DEFAULT NULL,
  event_date DATE NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Vehicle Parking
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_parking (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) DEFAULT 'sedan',
  vehicle_make VARCHAR(50) DEFAULT NULL,
  color VARCHAR(30) DEFAULT NULL,
  owner_name VARCHAR(150) NOT NULL,
  owner_phone VARCHAR(20) DEFAULT NULL,
  guest_id INT DEFAULT NULL,
  parking_spot VARCHAR(20) DEFAULT NULL,
  parking_rate DECIMAL(10,2) DEFAULT 0.00,
  check_in TIMESTAMP DEFAULT NULL,
  check_out TIMESTAMP DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'parked',
  total_charge DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Visitor Log
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_log (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(100) NOT NULL,
  visitor_phone VARCHAR(20) DEFAULT NULL,
  visitor_id_number VARCHAR(50) DEFAULT NULL,
  purpose VARCHAR(200) DEFAULT NULL,
  visiting_guest VARCHAR(100) DEFAULT NULL,
  room_number VARCHAR(10) DEFAULT NULL,
  vehicle_number VARCHAR(20) DEFAULT NULL,
  time_in TIMESTAMP NOT NULL,
  time_out TIMESTAMP DEFAULT NULL,
  logged_by INT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_visitor_time_in ON visitor_log(time_in);

-- ============================================================
-- Security Incidents
-- ============================================================
CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'low',
  location VARCHAR(100) DEFAULT NULL,
  description TEXT NOT NULL,
  reported_by VARCHAR(100) DEFAULT NULL,
  reported_by_user INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_si_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_si_created ON security_incidents(created_at);

-- ============================================================
-- Staff
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  position VARCHAR(50) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  contract_type VARCHAR(20) DEFAULT 'permanent',
  wage DECIMAL(12,2) DEFAULT 0.00,
  salary DECIMAL(12,2) DEFAULT 0.00,
  hire_date DATE DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'active',
  photo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Staff Shifts
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_shifts (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  shift_time VARCHAR(50) DEFAULT NULL,
  break_minutes INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Staff Leave
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_leave (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Staff Wages
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_wages (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id),
  amount DECIMAL(12,2) NOT NULL,
  pay_date DATE DEFAULT NULL,
  period VARCHAR(50) DEFAULT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  paid_by INT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Inventory Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Inventory Items
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT REFERENCES inventory_categories(id),
  quantity_in_stock DECIMAL(12,2) DEFAULT 0.00,
  unit VARCHAR(30) DEFAULT 'piece',
  reorder_level DECIMAL(12,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Stock Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES inventory_items(id),
  type VARCHAR(10) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  reference VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  recorded_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Seasonal Pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS seasonal_pricing (
  id SERIAL PRIMARY KEY,
  room_type_id INT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  season_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  cooking_space_price DECIMAL(12,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  effective_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Discounts
-- ============================================================
CREATE TABLE IF NOT EXISTS discounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) DEFAULT 'percentage',
  value DECIMAL(10,2) DEFAULT 0,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INT DEFAULT 0,
  used_count INT DEFAULT 0,
  applies_to VARCHAR(20) DEFAULT 'all',
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_disc_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_disc_status ON discounts(status);

-- ============================================================
-- Price Changes
-- ============================================================
CREATE TABLE IF NOT EXISTS price_changes (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(255) DEFAULT NULL,
  old_price DECIMAL(12,2) DEFAULT NULL,
  new_price DECIMAL(12,2) DEFAULT NULL,
  change_reason TEXT DEFAULT NULL,
  changed_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pc_item ON price_changes(item_type, item_id);

-- ============================================================
-- Activity Log
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT DEFAULT NULL,
  user_id INT DEFAULT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_al_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_al_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_al_created ON activity_log(created_at);

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  priority VARCHAR(20) DEFAULT 'medium',
  reference_id INT DEFAULT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Email Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS email_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Email Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Audit Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) DEFAULT NULL,
  record_id INT DEFAULT NULL,
  old_values TEXT DEFAULT NULL,
  new_values TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- Utility Bills
-- ============================================================
CREATE TABLE IF NOT EXISTS utility_bills (
  id SERIAL PRIMARY KEY,
  utility_type VARCHAR(50) NOT NULL,
  provider VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(50) DEFAULT NULL,
  bill_month VARCHAR(20) DEFAULT NULL,
  billing_period VARCHAR(50) DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE DEFAULT NULL,
  paid_date DATE DEFAULT NULL,
  receipt_number VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  recorded_by INT DEFAULT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Guest Searches
-- ============================================================
CREATE TABLE IF NOT EXISTS guest_searches (
  id SERIAL PRIMARY KEY,
  query VARCHAR(255) NOT NULL,
  searched_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Seed Data: Default Users (passwords are bcrypt hashed)
-- ============================================================
INSERT INTO users (username, password, full_name, role, status) VALUES
  ('admin', '$2b$10$K3gE3Jugc5TvaRUHzNgjFOwYb3y8Gv.1WaCi0WmM23IkX5aBhk7bG', 'Administrator', 'admin', 'active'),
  ('reception', '$2b$10$EqjJIUePU/4cQ0HwlcOxqOCW7mt95OTmRplbv8fc8w/zxyeDHjtIy', 'Receptionist', 'reception', 'active'),
  ('storekeeper', '$2b$10$ux8UivnNFdZMyZ88Dursv.TFv4h42QgvDSfbCS9Bv8wjYe2k3HGH2', 'Storekeeper', 'storekeeper', 'active'),
  ('security', '$2b$10$xXunMk/1EKWvMq6f4egnkeolRYs71cr3s0oD9XW1VpgdalST3ZYQG', 'Security Officer', 'security', 'active')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Seed Data: Room Types
-- ============================================================
INSERT INTO room_types (name, price, total_rooms, description) VALUES
  ('Standard', 50000.00, 10, 'Standard single room'),
  ('Deluxe', 80000.00, 8, 'Deluxe room with extra amenities'),
  ('Suite', 150000.00, 4, 'Executive suite'),
  ('Family', 120000.00, 3, 'Family room with multiple beds')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed Data: Conference Halls
-- ============================================================
INSERT INTO conference_halls (name, capacity, price_per_day, type, status) VALUES
  ('Main Hall', 200, 500000.00, 'conference', 'available'),
  ('Meeting Room A', 20, 100000.00, 'meeting', 'available'),
  ('Meeting Room B', 15, 80000.00, 'meeting', 'available'),
  ('Garden Area', 100, 300000.00, 'garden', 'available')
ON CONFLICT DO NOTHING;
