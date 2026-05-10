export default function MoneyLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
