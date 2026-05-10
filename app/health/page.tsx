import { prisma } from '../../lib/prisma';
import { getMetricsByType, formatMetricValue } from '../../lib/healthHelpers';
import { revalidatePath } from 'next/cache';
import { WeightChart, SleepChart, MoodChart } from '../../components/HealthCharts';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const userId = 1; // Hardcoded for now; use auth in production
  const metrics = await prisma.healthMetric.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const metricsGrouped = await getMetricsByType(userId);

  async function addMetric(formData: FormData) {
    'use server';
    const type = String(formData.get('type') ?? 'WEIGHT') as any;
    const value = parseFloat(String(formData.get('value') ?? '0')) || 0;
    const unit = String(formData.get('unit') ?? '');
    const date = new Date(String(formData.get('date') ?? new Date().toISOString()));

    await prisma.healthMetric.create({
      data: { userId, type, value, unit: unit || null, date }
    });
    revalidatePath('/health');
  }

  const weightMetrics = metricsGrouped.get('WEIGHT') || [];
  const sleepMetrics = metricsGrouped.get('SLEEP') || [];
  const moodMetrics = metricsGrouped.get('MOOD') || [];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Health</h2>
        <p className="text-sm text-gray-500">Log and track your health metrics.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-medium">Log metric</h3>
        <form action={addMetric} className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm">Type</label>
            <select name="type" className="mt-1 w-full rounded border px-3 py-2">
              <option>WEIGHT</option>
              <option>SLEEP</option>
              <option>HEART_RATE</option>
              <option>STEPS</option>
              <option>MOOD</option>
              <option>WATER_INTAKE</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Value</label>
            <input name="value" type="number" step="0.1" placeholder="e.g., 70.5" className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Unit (optional)</label>
            <input name="unit" placeholder="e.g., kg" className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Date</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Log</button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Weight over time</h3>
          <p className="text-sm text-gray-500">In kilograms</p>
          <div className="mt-4">
            <WeightChart data={weightMetrics} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="text-lg font-medium">Sleep hours (last 14 days)</h3>
          <p className="text-sm text-gray-500">In hours</p>
          <div className="mt-4">
            <SleepChart data={sleepMetrics} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-medium">Mood tracker (last 30 days)</h3>
        <p className="text-sm text-gray-500">Mood entries visualized</p>
        <div className="mt-4">
          <MoodChart data={moodMetrics} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-medium">Recent entries</h3>
        <ul className="mt-4 space-y-3">
          {metrics.length === 0 ? (
            <li className="text-sm text-gray-500">No metrics logged yet.</li>
          ) : (
            metrics.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{m.type.replace('_', ' ').toLowerCase()}</div>
                  <div className="text-xs text-gray-500">{new Date(m.date).toLocaleString()}</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">{formatMetricValue(m)}</div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
