import { cache } from 'react';
import { prisma } from './prisma';

type TransactionScope = {
  take?: number;
  orderBy?: 'asc' | 'desc';
  scopeKey?: string;
};

function parseScopeKey(scopeKey: string | undefined) {
  const [type, category, start, end, accountId, includeAccount] = (scopeKey ?? '').split('|');
  return {
    type: type || undefined,
    category: category || undefined,
    start: start || undefined,
    end: end || undefined,
    accountId: accountId ? Number(accountId) : undefined,
    includeAccount: includeAccount === '1'
  };
}

export const getUser = cache(async () => {
  return prisma.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, email: true }
  });
});

export const getAccounts = cache(async (userId: number) => {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      balance: true,
      userId: true
    }
  });
});

export const getTransactions = cache(async (userId: number, take = 50, orderBy: 'asc' | 'desc' = 'desc', scopeKey?: string) => {
  const scope = parseScopeKey(scopeKey);
  const where: any = { account: { userId } };

  if (scope.type) where.type = scope.type;
  if (scope.category) where.category = scope.category;
  if (scope.accountId) where.accountId = scope.accountId;
  if (scope.start || scope.end) {
    where.date = {
      ...(scope.start ? { gte: new Date(scope.start) } : {}),
      ...(scope.end ? { lt: new Date(scope.end) } : {})
    };
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: orderBy },
    take,
    include: scope.includeAccount ? { account: true } : undefined
  });
});

export const getHabits = cache(async (userId: number) => {
  return prisma.habit.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      frequency: true,
      targetCount: true,
      userId: true
    }
  });
});

export const getHealthMetrics = cache(async (userId: number, take = 100) => {
  return prisma.healthMetric.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take,
    select: {
      id: true,
      type: true,
      value: true,
      unit: true,
      date: true,
      userId: true
    }
  });
});

export const getJournalEntries = cache(async (userId: number, take = 20) => {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take,
    select: {
      id: true,
      title: true,
      content: true,
      mood: true,
      date: true,
      userId: true
    }
  });
});

export const getGoals = cache(async (userId: number, take = 50) => {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: [{ completed: 'asc' }, { targetDate: 'asc' }, { id: 'desc' }],
    take,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      targetValue: true,
      currentValue: true,
      unit: true,
      targetDate: true,
      completed: true,
      userId: true
    }
  });
});

export const getBills = cache(async (userId: number, take = 50, includePaid = true) => {
  return prisma.bill.findMany({
    where: {
      userId,
      ...(includePaid ? {} : { isPaid: false })
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    take,
    select: {
      id: true,
      userId: true,
      name: true,
      amount: true,
      dueDate: true,
      frequency: true,
      category: true,
      isPaid: true,
      paidDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    }
  });
});
