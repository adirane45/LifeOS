export default function JournalLoading() {
  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Add Entry Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-4"></div>
          <div className="space-y-3 mb-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>

        {/* Journal Entries */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
              <div className="space-y-2 mb-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
              <div className="h-8 bg-gray-100 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white rounded-lg p-6 shadow-sm hidden md:block">
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
