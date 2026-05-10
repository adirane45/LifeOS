import { prisma } from '../../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request, { params }: { params: Promise<{ habitId: string }> }) {
  const { habitId: habitIdStr } = await params;
  const habitId = Number(habitIdStr);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const existing = await prisma.habitLog.findFirst({
    where: { habitId, date: { gte: todayStart, lt: tomorrowStart } }
  });

  if (existing) {
    await prisma.habitLog.update({
      where: { id: existing.id },
      data: { completed: !existing.completed }
    });
  } else {
    await prisma.habitLog.create({
      data: { habitId, date: todayStart, completed: true, count: 1 }
    });
  }

  revalidatePath('/habits');
  return Response.json({ ok: true });
}
