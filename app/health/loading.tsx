export default function HealthLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
        <div className="h-10 bg-gray-300 rounded w-28 animate-pulse"></div>
      </div>

      {/* Add Metric Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Recent Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
