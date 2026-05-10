export default function HabitsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
        <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            {/* Heatmap rows */}
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex gap-1">
                  {[...Array(10)].map((_, k) => (
                    <div key={k} className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
