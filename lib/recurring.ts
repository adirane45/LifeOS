import { prisma } from './prisma';
import { createTransactionAndUpdateBalance } from './accountHelpers';

function addPeriod(date: Date, rule?: string) {
  const d = new Date(date);
  switch (rule) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function processRecurringTransactions() {
  const now = new Date();
  const parents = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      OR: [{ recurrenceEndDate: null }, { recurrenceEndDate: { gt: now } }]
    }
  });

  let processed = 0;
  let skipped = 0;

  for (const parent of parents) {
    if (!parent.recurrenceRule) continue;

    // find last child occurrence
    const lastChild = await prisma.transaction.findFirst({
      where: { parentTransactionId: parent.id },
      orderBy: { date: 'desc' }
    });

    let baseDate = lastChild ? new Date(lastChild.date) : new Date(parent.date);
    let nextDate = addPeriod(baseDate, parent.recurrenceRule || undefined);

    // loop to catch up missed occurrences
    while (nextDate <= now && (!parent.recurrenceEndDate || nextDate <= new Date(parent.recurrenceEndDate))) {
      // check if a child already exists for this date
      const exists = await prisma.transaction.findFirst({ where: { parentTransactionId: parent.id, date: nextDate } });
      if (exists) {
        skipped++;
        baseDate = nextDate;
        nextDate = addPeriod(baseDate, parent.recurrenceRule || undefined);
        continue;
      }

      // create child transaction
      await createTransactionAndUpdateBalance({
        accountId: parent.accountId,
        amount: parent.amount,
        category: parent.category,
        description: parent.description ?? undefined,
        date: nextDate,
        type: parent.type as any,
        isRecurring: false,
        parentTransactionId: parent.id
      });

      processed++;

      baseDate = nextDate;
      nextDate = addPeriod(baseDate, parent.recurrenceRule || undefined);
    }
  }

  return { processed, skipped };
}
