import Link from 'next/link';
import { AlertCircle, ArrowDownRight, ArrowUpRight, PlusCircle, TrendingDown, Wallet } from 'lucide-react';
import { prisma } from '../../lib/prisma';
import EmptyState from '../../components/EmptyState';
import { getAccounts, getBills, getTransactions, getUser } from '../../lib/data';
import NetWorthChart from '../../components/NetWorthChartClient';
import { convertAmount, formatCurrencyValue } from '../../lib/currency';
import { getNetWorthHistory } from '../../lib/netWorthHistory';

export const dynamic = 'force-dynamic';

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export default async function MoneyPage() {
  const now = new Date();
  const start = monthStart(now);
  const end = nextMonthStart(start);

  let user = await getUser();
  if (!user) {
    user = await prisma.user.create({ data: { name: 'Me', email: 'me@lifeos.local' }, select: { id: true, name: true, email: true, preferences: true } });
  }
  const userId = user?.id;
  
  // Get user's base currency preference
  const preferences = (user.preferences as any) || {};
  const baseCurrency = preferences.baseCurrency || 'INR';

  const [accounts, recent, activeBudgets, monthExpenses, unpaidBills, netWorthHistory] = await Promise.all([
    getAccounts(userId),
    getTransactions(userId, 10, 'desc', '|||||1').catch(() => []),
    userId
      ? prisma.budget.findMany({
          where: {
            userId,
            month: {
              gte: start,
              lt: end
            }
          },
          orderBy: { category: 'asc' }
        })
      : Promise.resolve([]),
    userId
      ? getTransactions(userId, 200, 'asc', `EXPENSE|||${start.toISOString()}|${end.toISOString()}||0`).catch(() => [])
      : Promise.resolve([]),
    userId ? getBills(userId, 50, false).catch(() => []) : Promise.resolve([]),
    userId ? getNetWorthHistory(userId, baseCurrency) : Promise.resolve([])
  ]);

  // Calculate converted net worth
  const accountsWithConversion = await Promise.all(
    accounts.map(async (account: any) => {
      if (account.currency === baseCurrency) {
        return { ...account, convertedBalance: account.balance };
      }
      try {
        const convertedBalance = await convertAmount(
          account.balance,
          account.currency,
          baseCurrency
        );
        return { ...account, convertedBalance };
      } catch (error) {
        console.error(`Failed to convert ${account.currency} to ${baseCurrency}:`, error);
        return { ...account, convertedBalance: account.balance }; // Fallback to original
      }
    })
  );

  const totalNetWorth = accountsWithConversion.reduce(
    (sum: number, acc: any) => sum + acc.convertedBalance,
    0
  );
  
  // Get currencies mentioned for display
  const currenciesUsed = [...new Set(accounts.map((a: any) => a.currency))].filter(c => c !== baseCurrency);
  const currencyLabel = currenciesUsed.length > 0 
    ? ` (converted from ${currenciesUsed.join(', ')})`
    : '';

  const spentByCategory = new Map<string, number>();
  for (const tx of monthExpenses) {
    spentByCategory.set(tx.category, (spentByCategory.get(tx.category) ?? 0) + tx.amount);
  }

  const budgetAlerts = activeBudgets.map((budget: any) => {
    const spent = spentByCategory.get(budget.category) ?? 0;
    const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return {
      budget,
      spent,
      percent,
      overspent: spent > budget.amount,
      nearLimit: spent <= budget.amount && percent >= 80
    };
  });

  const overdueBills = (Array.isArray(unpaidBills) ? unpaidBills : []).filter((bill: any) => new Date(bill.dueDate).getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime());

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-semibold">Money</h2>
        <p className="text-sm text-gray-600 dark:text-gray-500">Overview of accounts and recent transactions.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-500">
          <Link href="/money/accounts" className="text-blue-600 hover:text-blue-700">Accounts</Link>
          <Link href="/money/transactions" className="text-blue-600 hover:text-blue-700">Transactions</Link>
          <Link href="/money/budgets" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
            <TrendingDown className="h-4 w-4" />
            Budgets
          </Link>
        </div>
      </div>

      {overdueBills.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{overdueBills.length} overdue bill{overdueBills.length === 1 ? '' : 's'} need attention.</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-100/80">Open the Bills page to review due items and mark them paid.</p>
            </div>
          </div>
          <Link href="/money/bills" className="mt-3 inline-flex text-sm font-medium text-amber-900 underline decoration-amber-500 underline-offset-4 dark:text-amber-50">
            Review bills
          </Link>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Budget alerts</h3>
          <Link href="/money/budgets" className="text-sm text-blue-600">Manage budgets</Link>
        </div>
        <div className="mt-4 space-y-3">
          {budgetAlerts.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Set a monthly budget to track your spending.</div>
          ) : (
            budgetAlerts.map(({ budget, spent, percent, overspent, nearLimit }: any) => {
              const overspendBy = Math.max(0, spent - budget.amount);
              return (
                <div key={budget.id} className="rounded-xl bg-gray-50 p-4">
                  {overspent ? (
                    <p className="text-sm font-medium text-rose-700">⚠️ You've overspent on {budget.category} by ₹{overspendBy.toFixed(2)} (Budget: ₹{budget.amount.toFixed(2)})</p>
                  ) : nearLimit ? (
                    <p className="text-sm font-medium text-amber-700">📊 You've used {percent.toFixed(0)}% of your {budget.category} budget.</p>
                  ) : (
                    <p className="text-sm text-emerald-700">{budget.category} is within budget.</p>
                  )}

                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${overspent ? 'bg-rose-500' : nearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Spent ₹{spent.toFixed(2)} of ₹{budget.amount.toFixed(2)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Net Worth Over Time</h3>
          </div>
          <div className="mt-4">
            {netWorthHistory && netWorthHistory.length >= 2 ? (
              <NetWorthChart data={netWorthHistory} />
            ) : (
              <div className="flex h-[240px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                Not enough history yet. Start tracking transactions to see your net worth trend.
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-500 mt-3">Last 12 months in {baseCurrency}{currencyLabel}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Accounts</h3>
            <Link href="/money/accounts" className="text-sm text-blue-600">Manage</Link>
          </div>
          <div className="mt-4">
            {accounts.length === 0 ? (
              <EmptyState
                icon={<Wallet />}
                title="No accounts yet"
                description="Add your first account to start tracking balances."
                actionLabel="Add your first account"
                actionHref="/money/accounts#add-account"
              />
            ) : (
              <ul className="space-y-3">
                {accountsWithConversion.map((a: any) => (
                  <li key={a.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.type} • {a.currency}</div>
                      </div>
                      <div className="text-sm font-semibold">{formatCurrencyValue(a.balance, a.currency)}</div>
                    </div>
                    {a.currency !== baseCurrency && (
                      <div className="text-xs text-gray-600 pl-0">
                        ≈ {formatCurrencyValue(a.convertedBalance, baseCurrency)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent transactions</h3>
            <Link href="/money/transactions" className="text-sm text-blue-600">All</Link>
          </div>
          <div className="mt-4">
            {recent.length === 0 ? (
              <EmptyState
                icon={<PlusCircle />}
                title="No transactions recorded"
                description="Record an income or expense to see activity here."
                actionLabel="Add transaction"
                actionHref="/money/transactions#add-transaction"
              />
            ) : (
              <ul className="space-y-3">
                {recent.map((t: any) => (
                  <li key={t.id} className="flex flex-col gap-2 rounded-xl bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                    <div>
                      <div className="text-sm">{t.category}</div>
                      <div className="text-xs text-gray-500">{new Date(t.date).toLocaleString()} • {t.account?.name}</div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${t.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t.type === 'EXPENSE' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      {(t.type === 'EXPENSE' ? '-' : '+')}{t.amount.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
