import { prisma } from './prisma';

export async function createTransactionAndUpdateBalance(data: {
  accountId: number;
  amount: number;
  category: string;
  description?: string | null;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
}) {
  const signed = data.type === 'INCOME' ? data.amount : -Math.abs(data.amount);

  return await prisma.$transaction([
    prisma.transaction.create({ data: {
      accountId: data.accountId,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date,
      type: data.type
    }}),
    prisma.account.update({ where: { id: data.accountId }, data: { balance: { increment: signed } } })
  ]);
}

export async function deleteTransactionAndRevertBalance(transactionId: number) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return null;
  const signed = tx.type === 'INCOME' ? -tx.amount : Math.abs(tx.amount);

  return await prisma.$transaction([
    prisma.transaction.delete({ where: { id: transactionId } }),
    prisma.account.update({ where: { id: tx.accountId }, data: { balance: { increment: signed } } })
  ]);
}

export async function recalculateAccountBalance(accountId: number) {
  const res = await prisma.transaction.aggregate({ where: { accountId }, _sum: { amount: true } });
  const sum = res._sum.amount ?? 0;
  // Sum only transactions where INCOME adds and EXPENSE subtracts
  const transactions = await prisma.transaction.findMany({ where: { accountId }, select: { amount: true, type: true } });
  let total = 0;
  for (const t of transactions) {
    total += t.type === 'INCOME' ? t.amount : -t.amount;
  }
  return prisma.account.update({ where: { id: accountId }, data: { balance: total } });
}
