import { prisma } from '../../../../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request, { params }: { params: Promise<{ habitId: string }> }) {
  const { habitId: habitIdStr } = await params;
  const habitId = Number(habitIdStr);

  // Parse timezone offset from request body
  let timezoneOffsetMinutes: number | undefined;
  try {
    const body = await req.json();
    timezoneOffsetMinutes = body.timezoneOffsetMinutes;
  } catch {
    // If no body or JSON parsing fails, use server timezone (undefined)
  }

  // Log warning if timezone offset not provided
  if (!timezoneOffsetMinutes) {
    console.warn(`[Habit Toggle] No timezone offset provided for habit ${habitId}. Using server timezone.`);
  }

  // Compute today's date in the user's timezone
  const now = new Date();
  const offsetMinutes = timezoneOffsetMinutes ?? -now.getTimezoneOffset();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const localMs = utcMs + offsetMinutes * 60000;
  const localDate = new Date(localMs);
  
  const todayStart = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
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
