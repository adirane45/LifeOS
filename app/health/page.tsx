import { prisma } from '../../lib/prisma';
import { formatMetricValue } from '../../lib/healthHelpers';
import { revalidatePath } from 'next/cache';
import { Heart } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import ChartErrorBoundary from '../../components/ChartErrorBoundary';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FormSubmitWrapper from '../../components/FormSubmitWrapper';
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
    try {
      const type = String(formData.get('type') ?? 'WEIGHT') as any;
      const value = parseFloat(String(formData.get('value') ?? '0')) || 0;
      const unit = String(formData.get('unit') ?? '').trim();
      const date = new Date(String(formData.get('date') ?? new Date().toISOString()));

      // Validation
      if (!['WEIGHT', 'SLEEP', 'MOOD', 'BLOOD_PRESSURE', 'HEART_RATE'].includes(type)) throw new Error('Invalid metric type');
      if (value <= 0) throw new Error('Value must be greater than 0');
      if (isNaN(date.getTime())) throw new Error('Invalid date');

      await prisma.healthMetric.create({
        data: { userId, type, value, unit: unit || null, date }
      });
      revalidatePath('/health');
    } catch (error) {
      console.error('addMetric failed:', error);
      throw error;
    }
  }

  const weightMetrics = metricsGrouped.get('WEIGHT') || [];
  const sleepMetrics = metricsGrouped.get('SLEEP') || [];
  const moodMetrics = metricsGrouped.get('MOOD') || [];

  return (
    <section className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health</h2>
          <p className="text-sm text-gray-600 dark:text-gray-500">Log and track your health metrics.</p>
        </div>
        <Button href="/api/export/health" download aria-label="Export health metrics to CSV" variant="secondary" className="inline-flex items-center justify-center">Export CSV</Button>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Log metric</h3>
          <FormSubmitWrapper 
            action={addMetric}
            successMessage="Health metric logged successfully"
            errorMessage="Failed to log metric"
          >
            <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="metric-type" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Type</label>
              <select id="metric-type" name="type" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">
                <option>WEIGHT</option>
                <option>SLEEP</option>
                <option>HEART_RATE</option>
                <option>STEPS</option>
                <option>MOOD</option>
                <option>WATER_INTAKE</option>
              </select>
            </div>
            <div>
              <label htmlFor="metric-value" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Value</label>
              <input id="metric-value" name="value" type="number" step="0.1" placeholder="e.g., 70.5" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
            </div>
            <div>
              <label htmlFor="metric-unit" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Unit (optional)</label>
              <input id="metric-unit" name="unit" placeholder="e.g., kg" className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
            </div>
            <div>
              <label htmlFor="metric-date" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Date</label>
              <input id="metric-date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-gray-700 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900" />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary">Log</Button>
            </div>
            </div>
          </FormSubmitWrapper>
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
          <div className="mt-4 overflow-x-auto">
          <ul className="min-w-[320px] space-y-3">
            {metrics.length === 0 ? (
              <EmptyState icon={<Heart />} title="No health data recorded." description="Start logging your health metrics." actionLabel="Log metric" actionHref="#log-metric" />
            ) : (
              metrics.map((m: any) => (
                <li key={m.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        </div>
      </Card>
    </section>
  );
}
