import { prisma } from './prisma';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function computeStreak(habitId: number): Promise<number> {
  const now = new Date();
  let streak = 0;
  let currentDate = startOfDay(now);

  while (true) {
    const dateStart = currentDate;
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const log = await prisma.habitLog.findFirst({
      where: { habitId, date: { gte: dateStart, lt: dateEnd }, completed: true }
    });

    if (!log) break;
    streak += 1;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export async function getTodayLog(habitId: number) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return prisma.habitLog.findFirst({
    where: { habitId, date: { gte: todayStart, lt: tomorrowStart } }
  });
}

export async function getMonthLogs(habitId: number, year: number, month: number) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  return prisma.habitLog.findMany({
    where: { habitId, date: { gte: monthStart, lt: monthEnd } },
    orderBy: { date: 'asc' }
  });
}
