"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function NetWorthChart({ data }: { data?: { date: string; netWorth: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Not enough data to display chart.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value} />
        <Line type="monotone" dataKey="netWorth" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
