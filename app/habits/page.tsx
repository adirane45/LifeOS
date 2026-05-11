import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { prisma } from '../../lib/prisma';
import { computeStreak, getTodayLog, getMonthLogs } from '../../lib/habitHelpers';
import { revalidatePath } from 'next/cache';
import HabitCheckbox from '../../components/HabitCheckbox';
import HabitHeatmap from '../../components/HabitHeatmap';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getHabits } from '../../lib/data';

export const revalidate = 60;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function HabitsPage({ searchParams }: { searchParams: Promise<{ habitId?: string; tzOffset?: string }> }) {
  const params = await searchParams;
  const userId = 1; // Hardcoded for now; use auth in production
  
  // Parse timezone offset from query string if provided (in minutes from UTC)
  // Example: ?tzOffset=-300 for EST (UTC-5)
  const timezoneOffsetMinutes = params.tzOffset ? parseInt(params.tzOffset, 10) : undefined;

  const habits = await getHabits(userId);

  const habitsWithStreaks = await Promise.all(
    habits.map(async (h: any) => {
      const streak = await computeStreak(h.id, timezoneOffsetMinutes);
      const todayLog = await getTodayLog(h.id, timezoneOffsetMinutes);
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
      heatmapLogs = await getMonthLogs(id, now.getFullYear(), now.getMonth(), timezoneOffsetMinutes);
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
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold">Habits</h2>
        <p className="text-sm text-gray-500">Track your daily and weekly habits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Add habit</h3>
            <form id="add-habit" action={addHabit} className="mt-4 space-y-3">
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
              <Button type="submit" variant="primary">Add</Button>
            </div>
          </form>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Today's habits</h3>
            <ul className="mt-4 space-y-3">
            {habitsWithStreaks.length === 0 ? (
              <EmptyState icon={<ListChecks />} title="No habits tracked yet." description="Create your first habit to start tracking." actionLabel="Add habit" actionHref="#add-habit" />
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
        </Card>
      </div>

      {habitsWithStreaks.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Habit heatmap</h3>
          <p className="text-sm text-gray-500">View completion heatmap for a habit.</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="min-w-fit">
              <div className="text-sm font-medium mb-2">Select habit:</div>
              <ul className="space-y-2">
                {habitsWithStreaks.map((h: any) => (
                  <li key={h.id}>
                        <Button href={`/habits?habitId=${h.id}`} variant={heatmapHabit?.id === h.id ? 'secondary' : 'ghost'} size="sm" className={`text-sm px-3 py-1 rounded ${heatmapHabit?.id === h.id ? 'bg-primary/10 text-primary font-medium' : 'text-primary hover:bg-gray-100'}`}>
                          {h.name}
                        </Button>
                  </li>
                ))}
              </ul>
            </div>
            {heatmapHabit ? (
              <HabitHeatmap logs={heatmapLogs} year={new Date().getFullYear()} month={new Date().getMonth()} timezoneOffsetMinutes={timezoneOffsetMinutes} />
            ) : (
              <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                Select a habit to view its monthly heatmap.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
