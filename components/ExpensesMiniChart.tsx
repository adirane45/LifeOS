"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = {
  date: string;
  amount: number;
};

export default function ExpensesMiniChart({ data }: { data: DataPoint[] }) {
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
