"use client";

import dynamic from 'next/dynamic';

const ExpensesMiniChart = dynamic(() => import('./ExpensesMiniChart'), {
  ssr: false,
  loading: () => <div className="flex h-[180px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Loading chart...</div>
});

export default ExpensesMiniChart;
