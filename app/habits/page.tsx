import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import { computeStreak, getTodayLog, getMonthLogs } from '../../lib/habitHelpers';
import { revalidatePath } from 'next/cache';
import HabitCheckbox from '../../components/HabitCheckbox';
import HabitHeatmap from '../../components/HabitHeatmap';

export const dynamic = 'force-dynamic';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function HabitsPage({ searchParams }: { searchParams: Promise<{ habitId?: string }> }) {
  const params = await searchParams;
  const userId = 1; // Hardcoded for now; use auth in production
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });

  const habitsWithStreaks = await Promise.all(
    habits.map(async (h: any) => {
      const streak = await computeStreak(h.id);
      const todayLog = await getTodayLog(h.id);
      return { ...h, streak, todayCompleted: todayLog?.completed ?? false };
    })
  );

  // Heatmap for selected habit
  let heatmapHabit: any = null;
  let heatmapLogs: any[] = [];
  if (params.habitId) {
    const id = Number(params.habitId);
    heatmapHabit = habitsWithStreaks.find((h) => h.id === id);
    if (heatmapHabit) {
      const now = new Date();
      heatmapLogs = await getMonthLogs(id, now.getFullYear(), now.getMonth());
    }
  }

  async function addHabit(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '');
    const frequency = String(formData.get('frequency') ?? 'DAILY') as any;
    const targetCount = Number(formData.get('targetCount') ?? 1);

    await prisma.habit.create({
      data: { userId, name, frequency, targetCount }
    });
    revalidatePath('/habits');
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Habits</h2>
        <p className="text-sm text-gray-500">Track your daily and weekly habits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Add habit</h3>
          <form action={addHabit} className="mt-4 space-y-3">
            <div>
              <label className="text-sm">Name</label>
              <input name="name" placeholder="e.g., Exercise" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">Frequency</label>
              <select name="frequency" className="mt-1 w-full rounded border px-3 py-2">
                <option>DAILY</option>
                <option>WEEKLY</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Target count (per period)</label>
              <input name="targetCount" type="number" defaultValue="1" className="mt-1 w-full rounded border px-3 py-2" />
            </div>
            <div>
              <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Add</button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Today's habits</h3>
          <ul className="mt-4 space-y-3">
            {habitsWithStreaks.length === 0 ? (
              <li className="text-sm text-gray-500">No habits yet.</li>
            ) : (
              habitsWithStreaks.map((h: any) => (
                <li key={h.id} className="flex items-center gap-3">
                  <HabitCheckbox habitId={h.id} initialCompleted={h.todayCompleted} />
                  <div className="flex-1">
                    <div className={h.todayCompleted ? 'line-through text-gray-400' : 'text-gray-900'}>
                      {h.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      🔥 {h.streak} {h.streak === 1 ? 'day' : 'days'} streak
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {habitsWithStreaks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Habit heatmap</h3>
          <p className="text-sm text-gray-500">View completion heatmap for a habit.</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="min-w-fit">
              <div className="text-sm font-medium mb-2">Select habit:</div>
              <ul className="space-y-2">
                {habitsWithStreaks.map((h: any) => (
                  <li key={h.id}>
                    <Link
                      href={`/habits?habitId=${h.id}`}
                      className={`text-sm px-3 py-1 rounded ${
                        heatmapHabit?.id === h.id
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      {h.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {heatmapHabit && (
              <HabitHeatmap logs={heatmapLogs} year={new Date().getFullYear()} month={new Date().getMonth()} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
