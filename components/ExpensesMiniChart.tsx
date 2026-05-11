"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

type DataPoint = {
  date: string;
  amount: number;
};

export default function ExpensesMiniChart({ data }: { data: DataPoint[] }) {
  if (!data?.length) {
    return <div className="flex h-[180px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Not enough data to display chart.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e9ee" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value} labelFormatter={(label) => `Date: ${label}`} />
        <Area type="monotone" dataKey="amount" stroke="#2563eb" fill="url(#gradExpenses)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
