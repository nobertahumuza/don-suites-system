import { getFinanceStats, getRecentTransactions } from '@/lib/actions/finance';
import Link from 'next/link';

function formatCurrency(amount: number) {
  if (amount >= 1000000) return 'UGX ' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return 'UGX ' + (amount / 1000).toFixed(0) + 'K';
  return 'UGX ' + amount.toLocaleString();
}

export default async function FinancePage() {
  let stats: Record<string, number> = {};
  let transactions: Record<string, unknown>[] = [];
  try {
    [stats, transactions] = await Promise.all([getFinanceStats(), getRecentTransactions(10)]);
  } catch {
    stats = { todayIncome: 0, todayExpenses: 0, todayNet: 0, monthIncome: 0, monthExpenses: 0, monthNet: 0, totalIncome: 0, totalExpenses: 0 };
    transactions = [];
  }

  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
          <i className="fas fa-chart-line" style={{ color: '#c9a96e' }}></i> Finance Dashboard
        </h1>
        <div className="flex gap-2">
          <Link href="/finance/expenses" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#059669' }}>
            <i className="fas fa-plus-circle"></i> Record Expense
          </Link>
        </div>
      </div>

      <h6 className="text-xs font-semibold text-gray-400 uppercase mb-3">Today&apos;s Summary ({today})</h6>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Today's Income", value: stats.todayIncome, icon: 'fas fa-arrow-down-circle', color: '#10b981', border: '#10b981' },
          { label: "Today's Expenses", value: stats.todayExpenses, icon: 'fas fa-arrow-up-circle', color: '#ef4444', border: '#ef4444' },
          { label: "Today's Net", value: stats.todayNet, icon: 'fas fa-chart-line', color: stats.todayNet >= 0 ? '#10b981' : '#ef4444', border: stats.todayNet >= 0 ? '#10b981' : '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100" style={{ borderLeft: `4px solid ${s.border}` }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</div>
                <div className="text-xl font-extrabold mt-1" style={{ color: s.color }}>{formatCurrency(s.value)}</div>
              </div>
              <i className={`${s.icon} text-2xl opacity-20`} style={{ color: s.color }}></i>
            </div>
          </div>
        ))}
      </div>

      <h6 className="text-xs font-semibold text-gray-400 uppercase mb-3">This Month ({monthName})</h6>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Monthly Income', value: stats.monthIncome, color: '#10b981' },
          { label: 'Monthly Expenses', value: stats.monthExpenses, color: '#ef4444' },
          { label: 'Monthly Net', value: stats.monthNet, color: stats.monthNet >= 0 ? '#10b981' : '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</div>
            <div className="text-lg font-extrabold mt-1" style={{ color: s.color }}>{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">All-Time Income</div>
          <div className="text-xl font-extrabold mt-1" style={{ color: '#10b981' }}>{formatCurrency(stats.totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">All-Time Expenses</div>
          <div className="text-xl font-extrabold mt-1" style={{ color: '#ef4444' }}>{formatCurrency(stats.totalExpenses)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0f1a3c' }}>
            <i className="fas fa-exchange-alt" style={{ color: '#c9a96e' }}></i> Recent Transactions
          </h3>
          <div className="flex gap-1">
            <Link href="/finance/expenses" className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">Expenses</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #0f1a3c, #1a2d5a)' }}>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Date</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Type</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Category</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Description</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Amount</th>
                <th className="text-left text-white text-[10px] font-semibold px-4 py-3">Method</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No transactions yet</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id as number} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(txn.transaction_date as string).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${txn.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {txn.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{txn.category as string}</td>
                    <td className="px-4 py-3 text-xs">{txn.description as string}</td>
                    <td className="px-4 py-3 font-bold text-xs" style={{ color: txn.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold capitalize">
                        {(txn.payment_method as string)?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          { href: '/finance/expenses', icon: 'fa-receipt', label: 'Expenses', color: '#ef4444' },
          { href: '/finance/refunds', icon: 'fa-undo', label: 'Refunds', color: '#dc2626' },
          { href: '/finance/utilities', icon: 'fa-bolt', label: 'Utilities', color: '#f59e0b' },
          { href: '/finance/wages', icon: 'fa-money-check-alt', label: 'Wages', color: '#8b5cf6' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:shadow-md transition-all">
            <i className={`${link.icon} text-xl mb-2 block`} style={{ color: link.color }}></i>
            <div className="text-xs font-bold" style={{ color: link.color }}>{link.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
