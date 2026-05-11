import { prisma } from './prisma';
import { getMoodEmoji } from './moodUtils';

export async function getEntriesOnThisDay(userId: number, month: number, day: number) {
  const currentYear = new Date().getFullYear();
  const entries = await prisma.journalEntry.findMany({
    where: { userId }
  });

  // Filter entries from the same month/day but different years
  const thisDay = entries.filter((e: any) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getDate() === day && d.getFullYear() !== currentYear;
  });

  return thisDay.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export { getMoodEmoji };
