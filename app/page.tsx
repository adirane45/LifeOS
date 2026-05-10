import Link from 'next/link';
import { Wallet, Plus, TrendingUp, HeartPulse } from 'lucide-react';
import { prisma } from '../lib/prisma';
import ExpensesMiniChart from '../components/ExpensesMiniChart';

type LatestMetric = {
  type: string;
  value: number;
  unit: string | null;
  date: Date;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatMetricValue(metric: LatestMetric) {
  return metric.unit ? `${metric.value.toFixed(1)} ${metric.unit}` : metric.value.toFixed(1);
}

export default async function Page() {
  let user = await prisma.user.findFirst({
    include: {
      accounts: true
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Me',
        email: 'me@lifeos.local'
      },
      include: {
        accounts: true
      }
    });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [netWorth, todayExpenses, todayCompletedLogs, todayHabitLogs, habitsTotal, recentMetrics, expenseTransactions] =
    await Promise.all([
      prisma.account.aggregate({
        where: { userId: user.id },
        _sum: { balance: true }
      }),
      prisma.transaction.aggregate({
        where: {
          account: { userId: user.id },
          type: 'EXPENSE',
          date: {
            gte: todayStart,
            lt: tomorrowStart
          }
        },
        _sum: { amount: true }
      }),
      prisma.habitLog.count({
        where: {
          habit: { userId: user.id },
          completed: true,
          date: {
            gte: todayStart,
            lt: tomorrowStart
          }
        }
      }),
      prisma.habitLog.count({
        where: {
          habit: { userId: user.id },
          date: {
            gte: todayStart,
            lt: tomorrowStart
          }
        }
      }),
      prisma.habit.count({
        where: { userId: user.id }
      }),
      prisma.healthMetric.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' }
      }),
      prisma.transaction.findMany({
        where: {
          account: { userId: user.id },
          type: 'EXPENSE',
          date: {
            gte: sevenDaysAgo,
            lt: tomorrowStart
          }
        },
        orderBy: { date: 'asc' },
        select: { amount: true, date: true }
      })
    ]);

  const dailyExpenseMap = new Map<string, number>();
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + offset);
    dailyExpenseMap.set(localDateKey(date), 0);
  }

  for (const transaction of expenseTransactions) {
    const key = localDateKey(startOfDay(transaction.date));
    dailyExpenseMap.set(key, (dailyExpenseMap.get(key) ?? 0) + transaction.amount);
  }

  const expenseChartData = Array.from(dailyExpenseMap.entries()).map(([date, amount]) => ({
    date: formatDayLabel(new Date(`${date}T00:00:00`)),
    amount
  }));

  const latestMetricsMap = new Map<string, LatestMetric>();
  for (const metric of recentMetrics) {
    if (!latestMetricsMap.has(metric.type)) {
      latestMetricsMap.set(metric.type, metric);
    }
  }

  const netWorthValue = netWorth._sum.balance ?? 0;
  const todayExpenseValue = todayExpenses._sum.amount ?? 0;
  const habitCompletionRate = habitsTotal === 0 ? 0 : Math.round((todayCompletedLogs / habitsTotal) * 100);
  const currency = user.accounts[0]?.currency ?? 'USD';

  const stats = [
    {
      label: 'Total net worth',
      value: formatCurrency(netWorthValue, currency),
      icon: Wallet,
      accent: 'from-emerald-500 to-teal-600'
    },
    {
      label: "Today's expenses",
      value: formatCurrency(todayExpenseValue, currency),
      icon: Plus,
      accent: 'from-rose-500 to-orange-500'
    },
    {
      label: "Today's habit completion",
      value: `${habitCompletionRate}%`,
      icon: TrendingUp,
      accent: 'from-sky-500 to-indigo-600'
    },
    {
      label: 'Latest health metrics',
      value: latestMetricsMap.size > 0 ? `${latestMetricsMap.size} tracked` : 'No metrics yet',
      icon: HeartPulse,
      accent: 'from-violet-500 to-fuchsia-600'
    }
  ];

  const quickLinks = [
    { label: 'Add transaction', href: '/money/transactions', icon: Wallet },
    { label: 'Track habits', href: '/habits', icon: TrendingUp },
    { label: 'Log health', href: '/health', icon: HeartPulse }
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900">Welcome back, {user.name}</h2>
        <p className="mt-2 text-gray-600">Here is your LifeOS summary for today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-xl bg-gradient-to-br ${stat.accent} p-3 text-white`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expenses last 7 days</h3>
              <p className="text-sm text-gray-500">Grouped by day</p>
            </div>
          </div>
          {expenseTransactions.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
              No transactions yet.
            </div>
          ) : (
            <ExpensesMiniChart data={expenseChartData} />
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Quick add</h3>
          <p className="mt-1 text-sm text-gray-500">Jump to the most common inputs.</p>
          <div className="mt-4 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <span className="flex items-center gap-3">
                  <link.icon className="h-4 w-4 text-gray-600" />
                  {link.label}
                </span>
                <span className="text-gray-400">+</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Latest health metrics</h3>
          <p className="mt-1 text-sm text-gray-500">Most recent entry for each metric type.</p>
          <div className="mt-4 space-y-3">
            {latestMetricsMap.size === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
                No health metrics yet.
              </div>
            ) : (
              Array.from(latestMetricsMap.values()).map((metric) => (
                <div key={metric.type} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.type.replace('_', ' ').toLowerCase()}</p>
                    <p className="text-xs text-gray-500">Updated {metric.date.toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatMetricValue(metric)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Today&apos;s habit completion</h3>
          <p className="mt-1 text-sm text-gray-500">
            {todayHabitLogs === 0 ? 'No habit logs yet today.' : `${todayCompletedLogs} of ${todayHabitLogs} logs completed today.`}
          </p>
          <div className="mt-4 rounded-xl bg-gray-50 px-4 py-6 text-center">
            <div className="text-4xl font-semibold text-gray-900">{habitCompletionRate}%</div>
            <p className="mt-2 text-sm text-gray-500">Completion rate across all habits</p>
          </div>
        </div>
      </div>
    </section>
  );
}
