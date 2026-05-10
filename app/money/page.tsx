import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, PlusCircle, Wallet } from 'lucide-react';
import { prisma } from '../../lib/prisma';
import EmptyState from '../../components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function MoneyPage() {
  const accounts = await prisma.account.findMany({ orderBy: { id: 'asc' } });
  const recent = await prisma.transaction.findMany({ orderBy: { date: 'desc' }, take: 10, include: { account: true } });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Money</h2>
        <p className="text-sm text-gray-500">Overview of accounts and recent transactions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Accounts</h3>
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
                {accounts.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.type} • {a.currency}</div>
                    </div>
                    <div className="text-sm font-semibold">{a.balance.toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent transactions</h3>
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
                  <li key={t.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
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
