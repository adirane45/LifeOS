'use client';

import { useMemo } from 'react';

type HeatmapProps = {
  logs: any[];
  year: number;
  month: number;
  timezoneOffsetMinutes?: number;
};

export default function HabitHeatmap({ logs, year, month, timezoneOffsetMinutes }: HeatmapProps) {
  // Render last 90 days calendar heatmap with intensity
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const today = new Date();
  const startDate = new Date(today.getTime() - (90 - 1) * MS_PER_DAY);

  const offsetMinutes = timezoneOffsetMinutes ?? -new Date().getTimezoneOffset();
  const toLocalKey = (d: string | Date) => {
    const date = new Date(d);
    const localMs = date.getTime() + offsetMinutes * 60000;
    const loc = new Date(localMs);
    return loc.toISOString().slice(0, 10);
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < 90; i++) {
      const d = new Date(startDate.getTime() + i * MS_PER_DAY);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const log of logs) {
      const key = toLocalKey(log.date);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + (log.completed ? 1 : 0));
    }
    return map;
  }, [logs]);

  const maxCount = Math.max(...Array.from(counts.values()), 1);

  const dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 text-sm font-medium">Last 90 days</div>
      <div className="flex gap-4">
        <div className="hidden md:flex flex-col items-center gap-1 text-xs text-gray-500">
          {dayOfWeekLabels.map((d) => (
            <div key={d} className="h-6 w-6 flex items-center justify-center">{d[0]}</div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {Array.from({ length: 13 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((__, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  const date = new Date(startDate.getTime() + idx * MS_PER_DAY);
                  const iso = date.toISOString().slice(0, 10);
                  const count = counts.get(iso) ?? 0;
                  const intensity = Math.round((count / maxCount) * 4); // 0..4
                  const bg = ['bg-gray-100', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-600'][intensity];
                  return (
                    <div
                      key={iso}
                      title={`${date.toLocaleDateString()}: ${count} completions`}
                      className={`h-6 w-6 rounded cursor-default ${bg} flex items-center justify-center text-[10px] text-gray-700`}
                    >
                      {/* small dot for completeness */}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
