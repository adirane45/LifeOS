"use client";

import dynamic from 'next/dynamic';

const NetWorthChart = dynamic(() => import('./NetWorthChart'), {
  ssr: false,
  loading: () => <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});

export default NetWorthChart;
