import Link from 'next/link';
import { Wallet, PlusCircle, TrendingUp, HeartPulse, Target, CircleDollarSign, Activity, Circle, TrendingDown } from 'lucide-react';
import { prisma } from '../lib/prisma';
import ExpensesMiniChart from '../components/ExpensesMiniChart';
import ChartErrorBoundary from '../components/ChartErrorBoundary';

export const dynamic = 'force-dynamic';

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
  try {
    const value = typeof metric.value === 'number' ? metric.value : 0;
    return metric.unit ? `${value.toFixed(1)} ${metric.unit}` : value.toFixed(1);
  } catch {
    return '--';
  }
}

function clampPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getGoalProgress(goal: any) {
  const target = typeof goal.targetValue === 'number' ? goal.targetValue : 0;
  const current = typeof goal.currentValue === 'number' ? goal.currentValue : 0;
  if (target <= 0) return 0;
  return clampPercent((current / target) * 100);
}

function getGoalIcon(category: string) {
  switch (category) {
    case 'FINANCE':
      return CircleDollarSign;
    case 'HABIT':
      return TrendingUp;
    case 'HEALTH':
      return Activity;
    default:
      return Circle;
  }
}

function getGoalBarColor(category: string) {
  switch (category) {
    case 'FINANCE':
      return 'bg-emerald-500';
    case 'HABIT':
      return 'bg-sky-500';
    case 'HEALTH':
      return 'bg-rose-500';
    default:
      return 'bg-gray-500';
  }
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export default async function Page() {
  // Fetch or create user (critical for dashboard to work)
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

  // Ensure user object is valid
  if (!user?.id) {
    throw new Error('Failed to create or fetch user');
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thisMonthStart = monthStart(now);
  const thisMonthEnd = nextMonthStart(thisMonthStart);

  // Fetch all dashboard data in parallel with proper error handling
  const [netWorth, totalTransactionCount, todayExpenses, todayCompletedLogs, todayHabitLogs, habitsTotal, recentMetrics, expenseTransactions, activeGoals, monthBudgets, monthExpenseTransactions] =
    await Promise.all([
      prisma.account.aggregate({
        where: { userId: user.id },
        _sum: { balance: true }
      }).catch(() => ({ _sum: { balance: null } })),
      prisma.transaction.count({
        where: {
          account: { userId: user.id }
        }
      }).catch(() => 0),
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
      }).catch(() => ({ _sum: { amount: null } })),
      prisma.habitLog.count({
        where: {
          habit: { userId: user.id },
          completed: true,
          date: {
            gte: todayStart,
            lt: tomorrowStart
          }
        }
      }).catch(() => 0),
      prisma.habitLog.count({
        where: {
          habit: { userId: user.id },
          date: {
            gte: todayStart,
            lt: tomorrowStart
          }
        }
      }).catch(() => 0),
      prisma.habit.count({
        where: { userId: user.id }
      }).catch(() => 0),
      prisma.healthMetric.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' }
      }).catch(() => []),
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
      }).catch(() => []),
      prisma.goal.findMany({
        where: {
          userId: user.id,
          completed: false
        },
        orderBy: [{ targetDate: 'asc' }, { id: 'desc' }]
      }).catch(() => []),
      prisma.budget.findMany({
        where: {
          userId: user.id,
          month: {
            gte: thisMonthStart,
            lt: thisMonthEnd
          }
        },
        orderBy: { category: 'asc' }
      }).catch(() => []),
      prisma.transaction.findMany({
        where: {
          account: { userId: user.id },
          type: 'EXPENSE',
          date: { gte: thisMonthStart, lt: thisMonthEnd }
        },
        select: { category: true, amount: true }
      }).catch(() => [])
    ]);

  // Build expense chart data safely
  const safeExpenseTransactions = Array.isArray(expenseTransactions) ? expenseTransactions : [];
  const dailyExpenseMap = new Map<string, number>();
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + offset);
    dailyExpenseMap.set(localDateKey(date), 0);
  }

  for (const transaction of safeExpenseTransactions) {
    if (transaction?.date) {
      const key = localDateKey(startOfDay(transaction.date));
      dailyExpenseMap.set(key, (dailyExpenseMap.get(key) ?? 0) + (transaction.amount ?? 0));
    }
  }

  const expenseChartData = Array.from(dailyExpenseMap.entries()).map(([date, amount]) => ({
    date: formatDayLabel(new Date(`${date}T00:00:00`)),
    amount
  }));

  // Build latest metrics map safely
  const safeRecentMetrics = Array.isArray(recentMetrics) ? recentMetrics : [];
  const latestMetricsMap = new Map<string, LatestMetric>();
  for (const metric of safeRecentMetrics) {
    if (metric?.type && !latestMetricsMap.has(metric.type)) {
      latestMetricsMap.set(metric.type, metric);
    }
  }

  // Calculate dashboard values safely
  const netWorthValue = netWorth?._sum?.balance ?? 0;
  const todayExpenseValue = todayExpenses?._sum?.amount ?? 0;
  const safeHabitsTotal = Math.max(0, habitsTotal ?? 0);
  const safeTodayCompletedLogs = Math.max(0, todayCompletedLogs ?? 0);
  const habitCompletionRate = safeHabitsTotal === 0 ? 0 : Math.round((safeTodayCompletedLogs / safeHabitsTotal) * 100);
  const safeAccounts = Array.isArray(user?.accounts) ? user.accounts : [];
  const currency = safeAccounts[0]?.currency ?? 'USD';

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
      icon: PlusCircle,
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
    { label: 'Log health', href: '/health', icon: HeartPulse },
    { label: 'Manage goals', href: '/goals', icon: Target }
  ];

  const safeActiveGoals = Array.isArray(activeGoals) ? activeGoals : [];
  const safeMonthBudgets = Array.isArray(monthBudgets) ? monthBudgets : [];
  const safeMonthExpenses = Array.isArray(monthExpenseTransactions) ? monthExpenseTransactions : [];

  const spentByCategory = new Map<string, number>();
  for (const tx of safeMonthExpenses) {
    spentByCategory.set(tx.category, (spentByCategory.get(tx.category) ?? 0) + tx.amount);
  }

  const budgetStatuses = safeMonthBudgets.map((budget: any) => {
    const spent = spentByCategory.get(budget.category) ?? 0;
    const ratio = budget.amount > 0 ? spent / budget.amount : 0;
    return {
      budget,
      spent,
      ratio,
      percent: ratio * 100,
      overspentBy: Math.max(0, spent - budget.amount)
    };
  });

  const criticalBudget =
    budgetStatuses
      .filter((b) => b.ratio > 1)
      .sort((a, b) => b.overspentBy - a.overspentBy)[0] ??
    budgetStatuses.sort((a, b) => b.ratio - a.ratio)[0] ??
    null;

  if (safeAccounts.length === 0 && totalTransactionCount === 0 && safeHabitsTotal === 0 && safeRecentMetrics.length === 0 && safeActiveGoals.length === 0) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <PlusCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-gray-900">👋 Welcome to LifeOS! Start by adding an account, a habit, or a health metric.</h2>
          <p className="mt-2 text-sm text-gray-500">Use the quick actions below to get your dashboard moving.</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
              >
                <span className="flex items-center gap-3">
                  <link.icon className="h-4 w-4 text-gray-500" />
                  {link.label}
                </span>
                <PlusCircle className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900">Welcome back, {user?.name ?? 'User'}</h2>
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
          {safeExpenseTransactions.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center rounded-xl bg-gray-50 text-center text-sm text-gray-500">
              <Wallet className="h-8 w-8 text-gray-300" />
              <p className="mt-3">No transactions yet.</p>
            </div>
          ) : (
            <ChartErrorBoundary>
              <ExpensesMiniChart data={expenseChartData} />
            </ChartErrorBoundary>
          )}
        </div>

        <div className="space-y-6">
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

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Budget alert</h3>
            <p className="mt-1 text-sm text-gray-500">Most important monthly budget signal.</p>
            <div className="mt-4">
              {!criticalBudget ? (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                  Set a monthly budget to track your spending.{' '}
                  <Link href="/money/budgets" className="text-blue-600 hover:text-blue-700">Open budgets</Link>
                </div>
              ) : criticalBudget.ratio > 1 ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  ⚠️ You've overspent on {criticalBudget.budget.category} by ₹{criticalBudget.overspentBy.toFixed(2)} (Budget: ₹{criticalBudget.budget.amount.toFixed(2)}).
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  📊 {criticalBudget.percent.toFixed(0)}% of {criticalBudget.budget.category} budget used.
                </div>
              )}
            </div>

            {criticalBudget ? (
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className={`h-2 rounded-full ${criticalBudget.ratio > 1 ? 'bg-rose-500' : criticalBudget.ratio >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(criticalBudget.percent, 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">Spent ₹{criticalBudget.spent.toFixed(2)} of ₹{criticalBudget.budget.amount.toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Goal progress</h3>
          <p className="mt-1 text-sm text-gray-500">Track your active goals from here.</p>
          <div className="mt-4 space-y-3">
            {safeActiveGoals.length === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center rounded-xl bg-gray-50 text-center text-sm text-gray-500">
                <Target className="h-8 w-8 text-gray-300" />
                <p className="mt-3">Set a goal to track your progress.</p>
                <Link href="/goals" className="mt-2 text-blue-600 hover:text-blue-700">Go to goals</Link>
              </div>
            ) : (
              safeActiveGoals.map((goal: any) => {
                const GoalIcon = getGoalIcon(goal.category);
                const progress = getGoalProgress(goal);
                const unit = goal.unit ? ` ${goal.unit}` : '';
                return (
                  <div key={goal.id} className="rounded-xl bg-gray-50 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white p-1 text-gray-600">
                          <GoalIcon className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                      </div>
                      <span className="text-xs text-gray-500">{goal.category}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div className={`h-2 rounded-full ${getGoalBarColor(goal.category)}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {(goal.currentValue ?? 0).toFixed(2)}{unit} / {(goal.targetValue ?? 0).toFixed(2)}{unit}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Latest health metrics</h3>
          <p className="mt-1 text-sm text-gray-500">Most recent entry for each metric type.</p>
          <div className="mt-4 space-y-3">
            {latestMetricsMap.size === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center rounded-xl bg-gray-50 text-center text-sm text-gray-500">
                <HeartPulse className="h-8 w-8 text-gray-300" />
                <p className="mt-3">No health metrics yet.</p>
              </div>
            ) : (
              Array.from(latestMetricsMap.values()).map((metric) => {
                if (!metric?.type) return null;
                return (
                  <div key={metric.type} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{metric.type.replace('_', ' ').toLowerCase()}</p>
                      <p className="text-xs text-gray-500">Updated {metric.date?.toLocaleDateString?.() ?? 'unknown'}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatMetricValue(metric)}</p>
                  </div>
                );
              }).filter(Boolean)
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
