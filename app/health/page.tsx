import { prisma } from '../../lib/prisma';
import { formatMetricValue } from '../../lib/healthHelpers';
import { revalidatePath } from 'next/cache';
import { Heart } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import ChartErrorBoundary from '../../components/ChartErrorBoundary';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { getHealthMetrics } from '../../lib/data';
import { CombinedHealthChart, WeightChart, SleepChart, MoodChart } from '../../components/HealthChartsClient';

export const revalidate = 60;

export default async function HealthPage() {
  const userId = 1; // Hardcoded for now; use auth in production
  const metrics = await getHealthMetrics(userId, 200);

  const metricsGrouped = new Map<string, any[]>();
  for (const metric of metrics) {
    if (!metricsGrouped.has(metric.type)) {
      metricsGrouped.set(metric.type, []);
    }
    metricsGrouped.get(metric.type)!.push(metric);
  }

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
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health</h2>
          <p className="text-sm text-gray-500">Log and track your health metrics.</p>
        </div>
        <Button href="/api/export/health" download variant="secondary" className="inline-flex items-center justify-center">Export CSV</Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Log metric</h3>
          <form id="log-metric" action={addMetric} className="mt-4 grid gap-3 md:grid-cols-3">
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
              <Button type="submit" variant="primary">Log</Button>
            </div>
          </form>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Weight & Sleep (combined)</h3>
          <p className="text-sm text-gray-500">Dual-axis view: weight (line) and sleep (bars)</p>
          <div className="mt-4">
            <ChartErrorBoundary>
              <CombinedHealthChart weightData={weightMetrics} sleepData={sleepMetrics} />
            </ChartErrorBoundary>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Weight over time</h3>
            <p className="text-sm text-gray-500">In kilograms</p>
            <div className="mt-4">
              <ChartErrorBoundary>
                <WeightChart data={weightMetrics} />
              </ChartErrorBoundary>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Sleep hours (last 14 days)</h3>
            <p className="text-sm text-gray-500">In hours</p>
            <div className="mt-4">
              <ChartErrorBoundary>
                <SleepChart data={sleepMetrics} />
              </ChartErrorBoundary>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Mood tracker (last 30 days)</h3>
          <p className="text-sm text-gray-500">Mood entries visualized</p>
          <div className="mt-4">
            <ChartErrorBoundary>
              <MoodChart data={moodMetrics} />
            </ChartErrorBoundary>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Recent entries</h3>
          <ul className="mt-4 space-y-3">
            {metrics.length === 0 ? (
              <EmptyState icon={<Heart />} title="No health data recorded." description="Start logging your health metrics." actionLabel="Log metric" actionHref="#log-metric" />
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
      </Card>
    </section>
  );
}
