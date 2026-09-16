'use server';

import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getFinanceStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);
  const monthStart = new Date(`${thisMonth}-01`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const todayDate = new Date(today);

  const [todayIncomeResult, todayExpensesResult, monthIncomeResult, monthExpensesResult, totalIncomeResult, totalExpensesResult] = await Promise.all([
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'income', transaction_date: todayDate } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense', transaction_date: todayDate } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'income', transaction_date: { gte: monthStart, lt: monthEnd } } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense', transaction_date: { gte: monthStart, lt: monthEnd } } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'income' } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense' } }),
  ]);

  const todayIncomeVal = Number(todayIncomeResult._sum.amount) || 0;
  const todayExpensesVal = Number(todayExpensesResult._sum.amount) || 0;
  const monthIncomeVal = Number(monthIncomeResult._sum.amount) || 0;
  const monthExpensesVal = Number(monthExpensesResult._sum.amount) || 0;

  return {
    todayIncome: todayIncomeVal,
    todayExpenses: todayExpensesVal,
    todayNet: todayIncomeVal - todayExpensesVal,
    monthIncome: monthIncomeVal,
    monthExpenses: monthExpensesVal,
    monthNet: monthIncomeVal - monthExpensesVal,
    totalIncome: Number(totalIncomeResult._sum.amount) || 0,
    totalExpenses: Number(totalExpensesResult._sum.amount) || 0,
  };
}

export async function getRecentTransactions(limit = 10) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await prisma.financial_transactions.findMany({
    include: { users: true },
    orderBy: [{ transaction_date: 'desc' }, { id: 'desc' }],
    take: limit,
  });
  return result.map(r => ({ ...r, username: r.users?.username })) as Array<Record<string, unknown>>;
}

export async function createExpense(data: {
  category: string;
  description: string;
  notes: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
}) {
  const user = await requireRole(['admin']);
  const { category, description, notes, amount, payment_method, transaction_date } = data;
  if (!category) throw new Error('Category is required');
  if (!description) throw new Error('Description is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
  if (!transaction_date) throw new Error('Date is required');

  await prisma.financial_transactions.create({
    data: {
      type: 'expense',
      category,
      description,
      amount,
      payment_method: payment_method || 'cash',
      transaction_date: new Date(transaction_date),
      recorded_by: user.id,
    },
  });
  revalidatePath('/finance/expenses');
  revalidatePath('/finance');
  return { success: true };
}

export async function deleteExpense(expenseId: number) {
  const user = await requireRole(['admin']);
  await prisma.financial_transactions.deleteMany({ where: { id: expenseId, type: 'expense' } });
  revalidatePath('/finance/expenses');
  revalidatePath('/finance');
  return { success: true };
}

export async function getExpenses(filters?: { date_from?: string; date_to?: string; category?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: any = { type: 'expense' };
  if (filters?.date_from) where.transaction_date = { ...where.transaction_date, gte: new Date(filters.date_from) };
  if (filters?.date_to) where.transaction_date = { ...where.transaction_date, lte: new Date(filters.date_to) };
  if (filters?.category) where.category = filters.category;

  const result = await prisma.financial_transactions.findMany({
    where,
    include: { users: true },
    orderBy: [{ transaction_date: 'desc' }, { id: 'desc' }],
    take: 100,
  });
  return result.map(r => ({ ...r, recorded_by_name: r.users?.full_name })) as Array<Record<string, unknown>>;
}

export async function getExpenseStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [totalResult, monthResult, todayResult, todayCountResult] = await Promise.all([
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense' } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense', transaction_date: { gte: monthStart, lt: monthEnd } } }),
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'expense', transaction_date: { gte: todayStart, lt: todayEnd } } }),
    prisma.financial_transactions.count({ where: { type: 'expense', transaction_date: { gte: todayStart, lt: todayEnd } } }),
  ]);

  return {
    totalExpenses: Number(totalResult._sum.amount) || 0,
    monthExpenses: Number(monthResult._sum.amount) || 0,
    todayExpenses: Number(todayResult._sum.amount) || 0,
    todayCount: todayCountResult,
  };
}

export async function getExpenseCategories() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await prisma.expense_categories.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } });
  return result as Array<Record<string, unknown>>;
}

export async function createRefund(data: {
  amount: number;
  reason: string;
  reference_type: string;
  payment_method: string;
}) {
  const user = await requireRole(['admin']);
  const { amount, reason, reference_type, payment_method } = data;
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
  if (!reason) throw new Error('Reason is required');

  await prisma.financial_transactions.create({
    data: {
      type: 'refund',
      category: 'refund',
      description: `REFUND: ${reason}`,
      amount,
      reference_type: reference_type || null,
      payment_method: payment_method || 'cash',
      transaction_date: new Date(),
      recorded_by: user.id,
    },
  });
  revalidatePath('/finance/refunds');
  revalidatePath('/finance');
  return { success: true };
}

export async function getRefunds() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await prisma.financial_transactions.findMany({
    where: { type: 'refund' },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  return result as Array<Record<string, unknown>>;
}

export async function getRefundStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const [totalResult, countResult] = await Promise.all([
    prisma.financial_transactions.aggregate({ _sum: { amount: true }, where: { type: 'refund' } }),
    prisma.financial_transactions.count({ where: { type: 'refund' } }),
  ]);
  return {
    totalRefunds: Number(totalResult._sum.amount) || 0,
    refundCount: countResult,
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
  const user = await requireRole(['admin']);
  const { utility_type, provider, account_number, bill_month, amount, due_date, notes } = data;
  if (!utility_type) throw new Error('Utility type is required');
  if (!bill_month) throw new Error('Bill month is required');
  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

  await prisma.utility_bills.create({
    data: {
      utility_type,
      provider: provider || null,
      account_number: account_number || null,
      bill_month,
      amount,
      due_date: due_date ? new Date(due_date) : null,
      notes: notes || null,
      recorded_by: user.id,
    },
  });

  const desc = `${utility_type.charAt(0).toUpperCase() + utility_type.slice(1)} bill - ${provider || ''} (${bill_month})`;
  await prisma.financial_transactions.create({
    data: {
      type: 'expense',
      category: utility_type.toLowerCase(),
      description: desc,
      amount,
      payment_method: 'cash',
      transaction_date: new Date(),
      recorded_by: user.id,
    },
  });

  revalidatePath('/finance/utilities');
  revalidatePath('/finance');
  return { success: true };
}

export async function markUtilityBillPaid(billId: number, receiptNumber: string) {
  const user = await requireRole(['admin']);
  await prisma.utility_bills.update({
    where: { id: billId },
    data: { status: 'paid', paid_date: new Date(), receipt_number: receiptNumber || null },
  });
  revalidatePath('/finance/utilities');
  return { success: true };
}

export async function deleteUtilityBill(billId: number) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  await prisma.utility_bills.delete({ where: { id: billId } });
  revalidatePath('/finance/utilities');
  return { success: true };
}

export async function getUtilityBills(filter?: string) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const where: any = {};
  if (filter && filter !== 'all') where.status = filter;

  const result = await prisma.utility_bills.findMany({
    where,
    orderBy: [{ bill_month: 'desc' }, { created_at: 'desc' }],
    take: 50,
  });

  const userIds = [...new Set(result.map(r => r.recorded_by).filter(Boolean))] as number[];
  const users = userIds.length > 0 ? await prisma.users.findMany({ where: { id: { in: userIds } } }) : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  return result.map(r => ({
    ...r,
    recorded_by_name: r.recorded_by ? userMap.get(r.recorded_by)?.username ?? null : null,
  })) as Array<Record<string, unknown>>;
}

export async function getUtilityStats() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [pendingResult, paidMonthResult, pendingCountResult] = await Promise.all([
    prisma.utility_bills.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
    prisma.utility_bills.aggregate({ _sum: { amount: true }, where: { status: 'paid', paid_date: { gte: monthStart, lt: monthEnd } } }),
    prisma.utility_bills.count({ where: { status: 'pending' } }),
  ]);

  return {
    pendingTotal: Number(pendingResult._sum.amount) || 0,
    paidThisMonth: Number(paidMonthResult._sum.amount) || 0,
    pendingCount: pendingCountResult,
  };
}

export async function createExpenseCategory(data: { name: string; description: string }) {
  const user = await requireRole(['admin']);
  if (!data.name) throw new Error('Category name is required');
  await prisma.expense_categories.create({
    data: { name: data.name, description: data.description || null },
  });
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function updateExpenseCategory(categoryId: number, data: { name: string; description: string; status: string }) {
  const user = await requireRole(['admin']);
  await prisma.expense_categories.update({
    where: { id: categoryId },
    data: { name: data.name, description: data.description || null, status: data.status || 'active' },
  });
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function deleteExpenseCategory(categoryId: number) {
  const user = await requireRole(['admin']);
  await prisma.expense_categories.delete({ where: { id: categoryId } });
  revalidatePath('/finance/expense-categories');
  return { success: true };
}

export async function getAllExpenseCategories() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const result = await prisma.$queryRawUnsafe(`
    SELECT ec.*,
    (SELECT COUNT(*) FROM financial_transactions WHERE type = 'expense' AND description LIKE ('%' || ec.name || '%')) as usage_count,
    (SELECT COALESCE(SUM(amount),0) FROM financial_transactions WHERE type = 'expense' AND description LIKE ('%' || ec.name || '%') AND EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as month_total
    FROM expense_categories ec ORDER BY ec.name
  `);
  return result as Array<Record<string, unknown>>;
}

export async function updateProfile(data: { full_name: string; current_password?: string; new_password?: string }) {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  const { full_name, current_password, new_password } = data;
  if (!full_name) throw new Error('Full name is required');

  if (new_password) {
    if (!current_password) throw new Error('Current password is required to change password');
    if (new_password.length < 4) throw new Error('Password must be at least 4 characters');

    const userResult = await prisma.users.findUnique({ where: { id: user.id } });
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(current_password, userResult?.password || '');
    if (!valid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(new_password, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { full_name, password: hashed },
    });
  } else {
    await prisma.users.update({
      where: { id: user.id },
      data: { full_name },
    });
  }

  revalidatePath('/profile');
  return { success: true };
}
