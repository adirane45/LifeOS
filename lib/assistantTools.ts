import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import { createTransactionAndUpdateBalance } from './accountHelpers';
import { getUser } from './data';

type TransactionType = 'INCOME' | 'EXPENSE';

async function getOrCreateAssistantUserId() {
  const existingUser = await getUser();
  if (existingUser) {
    return existingUser.id;
  }

  const createdUser = await prisma.user.create({
    data: {
      name: 'Me',
      email: 'me@lifeos.local'
    }
  });

  return createdUser.id;
}

function getTodayWindow() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  return { todayStart, tomorrowStart };
}

export async function addTransaction(
  accountId: number,
  type: TransactionType,
  amount: number,
  category: string,
  description?: string,
  date?: string
) {
  try {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return { ok: false, error: 'Amount must be a positive number.' };
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return { ok: false, error: `Account ${accountId} was not found.` };
    }

    const parsedDate = date ? new Date(date) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, error: 'Invalid date supplied.' };
    }

    const transaction = await createTransactionAndUpdateBalance({
      accountId,
      type,
      amount: parsedAmount,
      category,
      description: description?.trim() || undefined,
      date: parsedDate
    });

    revalidatePath('/');
    revalidatePath('/money');
    revalidatePath('/money/transactions');

    return { ok: true, data: transaction };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function logHabit(habitId: number) {
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) {
      return { ok: false, error: `Habit ${habitId} was not found.` };
    }

    const { todayStart, tomorrowStart } = getTodayWindow();
    const existing = await prisma.habitLog.findFirst({
      where: {
        habitId,
        date: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    });

    const habitLog = existing
      ? await prisma.habitLog.update({
          where: { id: existing.id },
          data: { completed: true }
        })
      : await prisma.habitLog.create({
          data: {
            habitId,
            date: todayStart,
            completed: true,
            count: 1
          }
        });

    revalidatePath('/');
    revalidatePath('/habits');

    return { ok: true, data: habitLog };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createJournalEntry(title: string, content: string, mood?: string) {
  try {
    const userId = await getOrCreateAssistantUserId();
    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        mood: mood?.trim() || null,
        date: new Date()
      }
    });

    revalidatePath('/');
    revalidatePath('/journal');

    return { ok: true, data: entry };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}