"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
      <LineChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={[0, 'dataMax + 1']} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} labelFormatter={(label) => `Date: ${label}`} />
        <Line type="monotone" dataKey="amount" stroke="#111827" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
