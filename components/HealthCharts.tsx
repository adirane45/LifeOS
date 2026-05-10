'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export function WeightChart({ data }: { data: any[] }) {
  if (data.length === 0) return <div className="text-sm text-gray-500">No weight data yet.</div>;
  const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sorted.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.value
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SleepChart({ data }: { data: any[] }) {
  if (data.length === 0) return <div className="text-sm text-gray-500">No sleep data yet.</div>;
  const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sorted.slice(-14).map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sleep: m.value
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="sleep" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MoodChart({ data }: { data: any[] }) {
  if (data.length === 0) return <div className="text-sm text-gray-500">No mood data yet.</div>;
  const moodMap: { [k: string]: number } = { happy: 3, neutral: 2, sad: 1, anxious: 1, calm: 3 };
  const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sorted.slice(-30).map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: moodMap[m.value.toLowerCase()] || 2
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis type="number" dataKey="mood" domain={[0, 4]} />
        <Tooltip />
        <Scatter dataKey="mood" fill="#f97316" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
