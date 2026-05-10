import { prisma } from './prisma';

export async function getMetricsByType(userId: number) {
  const metrics = await prisma.healthMetric.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const grouped = new Map<string, any[]>();
  for (const metric of metrics) {
    if (!grouped.has(metric.type)) {
      grouped.set(metric.type, []);
    }
    grouped.get(metric.type)!.push(metric);
  }
  return grouped;
}

// `getMoodEmoji` moved to `lib/moodUtils.ts` to avoid pulling server-only code into client bundles.

export function formatMetricValue(metric: any): string {
  if (metric.unit) return `${metric.value.toFixed(1)} ${metric.unit}`;
  return metric.value.toFixed(1);
}
