"use client";

import dynamic from 'next/dynamic';

export const CombinedHealthChart = dynamic(() => import('./HealthCharts').then(mod => ({ default: mod.CombinedHealthChart })), {
  ssr: false,
  loading: () => <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});

export const WeightChart = dynamic(() => import('./HealthCharts').then(mod => ({ default: mod.WeightChart })), {
  ssr: false,
  loading: () => <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});

export const SleepChart = dynamic(() => import('./HealthCharts').then(mod => ({ default: mod.SleepChart })), {
  ssr: false,
  loading: () => <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});

export const MoodChart = dynamic(() => import('./HealthCharts').then(mod => ({ default: mod.MoodChart })), {
  ssr: false,
  loading: () => <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});
