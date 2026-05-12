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
  try {
    // Validation
    if (!data.accountId || data.accountId <= 0) throw new Error('Invalid account ID');
    if (!data.amount || data.amount <= 0) throw new Error('Amount must be greater than 0');
    if (!data.category?.trim()) throw new Error('Category is required');
    if (!['INCOME', 'EXPENSE'].includes(data.type)) throw new Error('Invalid transaction type');
    if (isNaN(data.date.getTime())) throw new Error('Invalid date');

    const signed = toSignedAmount(data.amount, data.type);

    return await prisma.$transaction(async (tx: any) => {
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
  } catch (error) {
    console.error('createTransactionAndUpdateBalance failed:', error);
    throw error;
  }
}

export async function deleteTransactionAndRevertBalance(transactionId: number) {
  try {
    // Validation
    if (!transactionId || transactionId <= 0) throw new Error('Invalid transaction ID');

    return await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction) throw new Error('Transaction not found');

      const signed = toSignedAmount(transaction.amount, transaction.type) * -1;

      await tx.transaction.delete({ where: { id: transactionId } });
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: signed } }
      });

      return transaction;
    });
  } catch (error) {
    console.error('deleteTransactionAndRevertBalance failed:', error);
    throw error;
  }
}

export async function recalculateAccountBalance(accountId: number) {
  try {
    // Validation
    if (!accountId || accountId <= 0) throw new Error('Invalid account ID');

    return await prisma.$transaction(async (tx: any) => {
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
  } catch (error) {
    console.error('recalculateAccountBalance failed:', error);
    throw error;
  }
}

export async function recalculateAllAccountBalances() {
  try {
    return await prisma.$transaction(async (tx: any) => {
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
  } catch (error) {
    console.error('recalculateAllAccountBalances failed:', error);
    throw error;
  }
}
