import { prisma } from './prisma';

/**
 * Compute the start of a day in the user's timezone.
 * @param date - The date to compute from
 * @param timezoneOffsetMinutes - User's timezone offset in minutes from UTC (e.g., -300 for EST)
 *                                Defaults to server's timezone if not provided
 */
function startOfDayInTimezone(date: Date, timezoneOffsetMinutes?: number): Date {
  const offsetMinutes = timezoneOffsetMinutes ?? -date.getTimezoneOffset();
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const localMs = utcMs + offsetMinutes * 60000;
  const localDate = new Date(localMs);

  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
}

/**
 * Legacy function for backward compatibility. Uses server's timezone.
 */
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute the streak for a habit, accounting for user's timezone.
 * @param habitId - The habit ID
 * @param timezoneOffsetMinutes - User's timezone offset in minutes from UTC
 */
export async function computeStreak(habitId: number, timezoneOffsetMinutes?: number): Promise<number> {
  const now = new Date();
  let streak = 0;
  let currentDate = startOfDayInTimezone(now, timezoneOffsetMinutes);

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

/**
 * Get today's habit log, accounting for user's timezone.
 * @param habitId - The habit ID
 * @param timezoneOffsetMinutes - User's timezone offset in minutes from UTC
 */
export async function getTodayLog(habitId: number, timezoneOffsetMinutes?: number) {
  const now = new Date();
  const todayStart = startOfDayInTimezone(now, timezoneOffsetMinutes);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  return prisma.habitLog.findFirst({
    where: { habitId, date: { gte: todayStart, lt: tomorrowStart } }
  });
}

/**
 * Get all habit logs for a month, accounting for user's timezone.
 * @param habitId - The habit ID
 * @param year - The year
 * @param month - The month (0-indexed)
 * @param timezoneOffsetMinutes - User's timezone offset in minutes from UTC
 */
export async function getMonthLogs(habitId: number, year: number, month: number, timezoneOffsetMinutes?: number) {
  // Compute month boundaries in the user's timezone
  const monthStartLocalDate = new Date(year, month, 1);
  const monthEndLocalDate = new Date(year, month + 1, 1);

  // Convert to UTC for Prisma query
  const offsetMinutes = timezoneOffsetMinutes ?? -new Date().getTimezoneOffset();
  const monthStartUTC = new Date(monthStartLocalDate.getTime() - offsetMinutes * 60000);
  const monthEndUTC = new Date(monthEndLocalDate.getTime() - offsetMinutes * 60000);

  return prisma.habitLog.findMany({
    where: { habitId, date: { gte: monthStartUTC, lt: monthEndUTC } },
    orderBy: { date: 'asc' }
  });
}
