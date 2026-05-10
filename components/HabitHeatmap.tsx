'use client';

import { useMemo } from 'react';

type HeatmapProps = {
  logs: any[];
  year: number;
  month: number;
};

export default function HabitHeatmap({ logs, year, month }: HeatmapProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.completed) {
        const d = new Date(log.date);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        set.add(key);
      }
    }
    return set;
  }, [logs]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-4 text-sm font-medium">
        {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-gray-500">
            {label}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(year, month, i + 1);
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const isCompleted = completedDates.has(key);
          return (
            <div
              key={i + 1}
              className={`flex h-8 items-center justify-center rounded text-xs font-medium ${
                isCompleted ? 'bg-green-200 text-green-900' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}
