import { prisma } from './prisma';

type TransactionType = 'INCOME' | 'EXPENSE';

function toSignedAmount(amount: number, type: TransactionType) {
  const safeAmount = Math.abs(amount);
  return type === 'INCOME' ? safeAmount : -safeAmount;
}

export async function createTransactionAndUpdateBalance(data: {
  accountId: number;
  amount: number;
  category: string;
  description?: string | null;
  date: Date;
  type: TransactionType;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndDate?: Date | null;
  parentTransactionId?: number | null;
}) {
  const signed = toSignedAmount(data.amount, data.type);

  return prisma.$transaction(async (tx: any) => {
    const created = await tx.transaction.create({
      data: {
        accountId: data.accountId,
        amount: Math.abs(data.amount),
        category: data.category,
        description: data.description,
        date: data.date,
        type: data.type,
        isRecurring: data.isRecurring ?? false,
        recurrenceRule: data.recurrenceRule ?? null,
        recurrenceEndDate: data.recurrenceEndDate ?? null,
        parentTransactionId: data.parentTransactionId ?? null
      }
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: signed } }
    });

    return created;
  });
}

export async function deleteTransactionAndRevertBalance(transactionId: number) {
  return prisma.$transaction(async (tx: any) => {
    const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) return null;

    const signed = toSignedAmount(transaction.amount, transaction.type) * -1;

    await tx.transaction.delete({ where: { id: transactionId } });
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: signed } }
    });

    return transaction;
  });
}

export async function recalculateAccountBalance(accountId: number) {
  return prisma.$transaction(async (tx: any) => {
    const transactions = await tx.transaction.findMany({
      where: { accountId },
      select: { amount: true, type: true }
    });

    let total = 0;
    for (const transaction of transactions) {
      total += transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
    }

    return tx.account.update({
      where: { id: accountId },
      data: { balance: total }
    });
  });
}

export async function recalculateAllAccountBalances() {
  return prisma.$transaction(async (tx: any) => {
    const accounts = await tx.account.findMany({ select: { id: true, name: true } });
    const updatedBalances: Array<{ id: number; name: string; balance: number }> = [];

    for (const account of accounts) {
      const transactions = await tx.transaction.findMany({
        where: { accountId: account.id },
        select: { amount: true, type: true }
      });

      let balance = 0;
      for (const transaction of transactions) {
        balance += transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
      }

      await tx.account.update({
        where: { id: account.id },
        data: { balance }
      });

      updatedBalances.push({ id: account.id, name: account.name, balance });
    }

    return updatedBalances;
  });
}
