'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getFinanceStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const todayIncomeResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='income' AND transaction_date=$1", [today]);
  const todayExpensesResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='expense' AND transaction_date=$1", [today]);
  const monthIncomeResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='income' AND TO_CHAR(transaction_date, 'YYYY-MM')=$1", [thisMonth]);
  const monthExpensesResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='expense' AND TO_CHAR(transaction_date, 'YYYY-MM')=$1", [thisMonth]);
  const totalIncomeResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='income'");
  const totalExpensesResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type='expense'");

  const todayIncomeVal = Number(todayIncomeResult.rows[0]?.total ?? 0);
  const todayExpensesVal = Number(todayExpensesResult.rows[0]?.total ?? 0);
  const monthIncomeVal = Number(monthIncomeResult.rows[0]?.total ?? 0);
  const monthExpensesVal = Number(monthExpensesResult.rows[0]?.total ?? 0);

  return {
    todayIncome: todayIncomeVal,
    todayExpenses: todayExpensesVal,
    todayNet: todayIncomeVal - todayExpensesVal,
    monthIncome: monthIncomeVal,
    monthExpenses: monthExpensesVal,
    monthNet: monthIncomeVal - monthExpensesVal,
    totalIncome: Number(totalIncomeResult.rows[0]?.total ?? 0),
    totalExpenses: Number(totalExpensesResult.rows[0]?.total ?? 0),
  };
}

export async function getRecentTransactions(limit = 10) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await pool.query(
    `SELECT ft.*, u.username FROM financial_transactions ft JOIN users u ON ft.recorded_by = u.id ORDER BY ft.transaction_date DESC, ft.id DESC LIMIT $1`,
    [limit]
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function createExpense(data: {
  category: string;
  description: string;
  notes: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { category, description, notes, amount, payment_method, transaction_date } = data;
  if (!category) throw new Error('Category is required');
  if (!description) throw new Error('Description is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
  if (!transaction_date) throw new Error('Date is required');

  await pool.query(
    "INSERT INTO financial_transactions (type, category, description, notes, amount, payment_method, transaction_date, recorded_by) VALUES ('expense', $1, $2, $3, $4, $5, $6, $7)",
    [category, description, notes || null, amount, payment_method || 'cash', transaction_date, user.id]
  );
  revalidatePath('/finance/expenses');
  revalidatePath('/finance');
  return { success: true };
}

export async function deleteExpense(expenseId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.query("DELETE FROM financial_transactions WHERE id = $1 AND type = 'expense'", [expenseId]);
  revalidatePath('/finance/expenses');
  revalidatePath('/finance');
  return { success: true };
}

export async function getExpenses(filters?: { date_from?: string; date_to?: string; category?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  let query = "SELECT ft.*, u.full_name as recorded_by_name FROM financial_transactions ft LEFT JOIN users u ON ft.recorded_by = u.id WHERE ft.type = 'expense'";
  const params: string[] = [];

  if (filters?.date_from) {
    query += ` AND ft.transaction_date >= $${params.length + 1}`;
    params.push(filters.date_from);
  }
  if (filters?.date_to) {
    query += ` AND ft.transaction_date <= $${params.length + 1}`;
    params.push(filters.date_to);
  }
  if (filters?.category) {
    query += ` AND ft.category = $${params.length + 1}`;
    params.push(filters.category);
  }
  query += ' ORDER BY ft.transaction_date DESC, ft.id DESC LIMIT 100';

  const result = await pool.query(query, params);
  return result.rows as Array<Record<string, unknown>>;
}

export async function getExpenseStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const totalExpensesResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM financial_transactions WHERE type='expense'");
  const monthExpensesResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM financial_transactions WHERE type='expense' AND EXTRACT(MONTH FROM transaction_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date)=EXTRACT(YEAR FROM CURRENT_DATE)");
  const todayExpensesResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM financial_transactions WHERE type='expense' AND DATE(transaction_date)=CURRENT_DATE");
  const todayCountResult = await pool.query("SELECT COUNT(*) as c FROM financial_transactions WHERE type='expense' AND DATE(transaction_date)=CURRENT_DATE");
  return {
    totalExpenses: Number(totalExpensesResult.rows[0]?.t ?? 0),
    monthExpenses: Number(monthExpensesResult.rows[0]?.t ?? 0),
    todayExpenses: Number(todayExpensesResult.rows[0]?.t ?? 0),
    todayCount: Number(todayCountResult.rows[0]?.c ?? 0),
  };
}

export async function getExpenseCategories() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await pool.query("SELECT name FROM expense_categories WHERE status='active' ORDER BY name");
  return result.rows as Array<Record<string, unknown>>;
}

export async function createRefund(data: {
  amount: number;
  reason: string;
  reference_type: string;
  payment_method: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { amount, reason, reference_type, payment_method } = data;
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
  if (!reason) throw new Error('Reason is required');

  await pool.query(
    "INSERT INTO financial_transactions (type, category, description, amount, reference_type, payment_method, transaction_date, recorded_by) VALUES ('refund', 'refund', $1, $2, $3, $4, CURRENT_DATE, $5)",
    [`REFUND: ${reason}`, amount, reference_type || null, payment_method || 'cash', user.id]
  );
  revalidatePath('/finance/refunds');
  revalidatePath('/finance');
  return { success: true };
}

export async function getRefunds() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await pool.query("SELECT * FROM financial_transactions WHERE type='refund' ORDER BY created_at DESC LIMIT 50");
  return result.rows as Array<Record<string, unknown>>;
}

export async function getRefundStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const totalResult = await pool.query("SELECT COALESCE(SUM(amount),0) as c FROM financial_transactions WHERE type='refund'");
  const countResult = await pool.query("SELECT COUNT(*) as c FROM financial_transactions WHERE type='refund'");
  return {
    totalRefunds: Number(totalResult.rows[0]?.c ?? 0),
    refundCount: Number(countResult.rows[0]?.c ?? 0),
  };
}

export async function createUtilityBill(data: {
  utility_type: string;
  provider: string;
  account_number: string;
  bill_month: string;
  amount: number;
  due_date: string;
  notes: string;
}) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { utility_type, provider, account_number, bill_month, amount, due_date, notes } = data;
  if (!utility_type) throw new Error('Utility type is required');
  if (!bill_month) throw new Error('Bill month is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

  await pool.query(
    'INSERT INTO utility_bills (utility_type, provider, account_number, bill_month, amount, due_date, notes, recorded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [utility_type, provider || null, account_number || null, bill_month, amount, due_date || null, notes || null, user.id]
  );

  const desc = `${utility_type.charAt(0).toUpperCase() + utility_type.slice(1)} bill - ${provider || ''} (${bill_month})`;
  await pool.query(
    "INSERT INTO financial_transactions (type, category, description, amount, payment_method, transaction_date, recorded_by) VALUES ('expense',$1,$2,$3, 'cash', CURRENT_DATE, $4)",
    [utility_type.toLowerCase(), desc, amount, user.id]
  );

  revalidatePath('/finance/utilities');
  revalidatePath('/finance');
  return { success: true };
}

export async function markUtilityBillPaid(billId: number, receiptNumber: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.query("UPDATE utility_bills SET status='paid', paid_date=CURRENT_DATE, receipt_number=$1 WHERE id=$2", [receiptNumber || null, billId]);
  revalidatePath('/finance/utilities');
  return { success: true };
}

export async function deleteUtilityBill(billId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.query('DELETE FROM utility_bills WHERE id = $1', [billId]);
  revalidatePath('/finance/utilities');
  return { success: true };
}

export async function getUtilityBills(filter?: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  let query = 'SELECT ub.*, u.username as recorded_by_name FROM utility_bills ub LEFT JOIN users u ON ub.recorded_by = u.id';
  const params: string[] = [];

  if (filter && filter !== 'all') {
    query += ` WHERE ub.status = $${params.length + 1}`;
    params.push(filter);
  }
  query += ' ORDER BY ub.bill_month DESC, ub.created_at DESC LIMIT 50';

  const result = await pool.query(query, params);
  return result.rows as Array<Record<string, unknown>>;
}

export async function getUtilityStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const pendingResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM utility_bills WHERE status='pending'");
  const paidMonthResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM utility_bills WHERE status='paid' AND EXTRACT(MONTH FROM paid_date) = EXTRACT(MONTH FROM CURRENT_DATE)");
  const pendingCountResult = await pool.query("SELECT COUNT(*) as c FROM utility_bills WHERE status='pending'");
  return {
    pendingTotal: Number(pendingResult.rows[0]?.t ?? 0),
    paidThisMonth: Number(paidMonthResult.rows[0]?.t ?? 0),
    pendingCount: Number(pendingCountResult.rows[0]?.c ?? 0),
  };
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

  await pool.query(
    'INSERT INTO staff_wages (staff_id, amount, pay_date, payment_method, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6)',
    [staff_id, amount, pay_date, payment_method || 'cash', notes || null, user.id]
  );

  const staffResult = await pool.query('SELECT full_name FROM staff WHERE id = $1', [staff_id]);
  const staffName = staffResult.rows[0]?.full_name ?? 'Staff';
  const dbMethod = payment_method === 'momo' ? 'mobile_money' : payment_method === 'airtel_money' ? 'mobile_money' : payment_method === 'bank' ? 'bank_transfer' : 'cash';
  const desc = `Wages - ${staffName}`;
  await pool.query(
    "INSERT INTO financial_transactions (type, category, description, amount, payment_method, transaction_date, recorded_by) VALUES ('expense','wages',$1,$2,$3,CURRENT_DATE,$4)",
    [desc, amount, dbMethod, user.id]
  );

  revalidatePath('/finance/wages');
  revalidatePath('/finance');
  return { success: true };
}

export async function getWages(filters?: { month?: string; method?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const month = filters?.month || new Date().toISOString().slice(0, 7);
  let query = `SELECT sw.*, s.full_name, s.position FROM staff_wages sw JOIN staff s ON sw.staff_id = s.id WHERE TO_CHAR(sw.pay_date, 'YYYY-MM') = $1`;
  const params: string[] = [month];

  if (filters?.method) {
    query += ` AND sw.payment_method = $${params.length + 1}`;
    params.push(filters.method);
  }
  query += ' ORDER BY sw.pay_date DESC';

  const result = await pool.query(query, params);
  return result.rows as Array<Record<string, unknown>>;
}

export async function getWageStats(month: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const totalPaidResult = await pool.query("SELECT COALESCE(SUM(amount),0) as t FROM staff_wages WHERE TO_CHAR(pay_date, 'YYYY-MM') = $1", [month]);
  const staffCountResult = await pool.query("SELECT COUNT(DISTINCT staff_id) as c FROM staff_wages WHERE TO_CHAR(pay_date, 'YYYY-MM') = $1", [month]);
  const methodStatsResult = await pool.query("SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM staff_wages WHERE TO_CHAR(pay_date, 'YYYY-MM') = $1 GROUP BY payment_method", [month]);
  return {
    totalPaid: Number(totalPaidResult.rows[0]?.t ?? 0),
    staffCount: Number(staffCountResult.rows[0]?.c ?? 0),
    methodStats: methodStatsResult.rows as Array<Record<string, unknown>>,
  };
}

export async function createExpenseCategory(data: { name: string; description: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (!data.name) throw new Error('Category name is required');
  await pool.query('INSERT INTO expense_categories (name, description) VALUES ($1, $2)', [data.name, data.description || null]);
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function updateExpenseCategory(categoryId: number, data: { name: string; description: string; status: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.query('UPDATE expense_categories SET name=$1, description=$2, status=$3 WHERE id=$4', [data.name, data.description || null, data.status || 'active', categoryId]);
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function deleteExpenseCategory(categoryId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await pool.query('DELETE FROM expense_categories WHERE id = $1', [categoryId]);
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function getAllExpenseCategories() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await pool.query(`
    SELECT ec.*,
    (SELECT COUNT(*) FROM financial_transactions WHERE type = 'expense' AND description LIKE ('%' || ec.name || '%')) as usage_count,
    (SELECT COALESCE(SUM(amount),0) FROM financial_transactions WHERE type = 'expense' AND description LIKE ('%' || ec.name || '%') AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as month_total
    FROM expense_categories ec ORDER BY ec.name
  `);
  return result.rows as Array<Record<string, unknown>>;
}

export async function updateProfile(data: { full_name: string; current_password?: string; new_password?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { full_name, current_password, new_password } = data;
  if (!full_name) throw new Error('Full name is required');

  if (new_password) {
    if (!current_password) throw new Error('Current password is required to change password');
    if (new_password.length < 4) throw new Error('Password must be at least 4 characters');

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [user.id]);
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(current_password, (userResult.rows[0]?.password as string) || '');
    if (!valid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET full_name = $1, password = $2 WHERE id = $3', [full_name, hashed, user.id]);
  } else {
    await pool.query('UPDATE users SET full_name = $1 WHERE id = $2', [full_name, user.id]);
  }

  revalidatePath('/profile');
  return { success: true };
}
