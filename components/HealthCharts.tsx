'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ComposedChart } from 'recharts';

function ChartEmptyState() {
  return <div className="flex h-[300px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">Not enough data to display chart.</div>;
}

export function WeightChart({ data }: { data?: any[] }) {
  if (!data?.length) return <ChartEmptyState />;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

export function SleepChart({ data }: { data?: any[] }) {
  if (!data?.length) return <ChartEmptyState />;
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

export function MoodChart({ data }: { data?: any[] }) {
  if (!data?.length) return <ChartEmptyState />;
  const moodMap: { [k: string]: number } = { happy: 3, neutral: 2, sad: 1, anxious: 1, calm: 3 };
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

export function CombinedHealthChart({ weightData, sleepData }: { weightData?: any[]; sleepData?: any[] }) {
  const hasData = (weightData?.length || sleepData?.length);
  if (!hasData) return <ChartEmptyState />;

  // Build a unified date keyed array for the last 90 days (or available dates)
  const allDatesSet = new Set<string>();
  (weightData || []).forEach((d) => allDatesSet.add(new Date(d.date).toISOString().slice(0, 10)));
  (sleepData || []).forEach((d) => allDatesSet.add(new Date(d.date).toISOString().slice(0, 10)));
  const allDates = Array.from(allDatesSet).sort();

  const chartData = allDates.map((iso) => {
    const w = (weightData || []).find((d) => new Date(d.date).toISOString().slice(0, 10) === iso);
    const s = (sleepData || []).find((d) => new Date(d.date).toISOString().slice(0, 10) === iso);
    return {
      date: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w ? Number(w.value) : null,
      sleep: s ? Number(s.value) : null
    };
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Bar yAxisId="right" dataKey="sleep" fill="#f59e0b" />
        <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={false} yAxisId="left" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
