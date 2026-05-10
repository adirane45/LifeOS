export default function AssistantLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* System/Assistant message */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="flex-1 max-w-md">
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-3/5 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex gap-2 justify-end">
          <div className="flex-1 max-w-md">
            <div className="bg-blue-100 rounded-lg p-4 space-y-2">
              <div className="h-4 bg-blue-300 rounded animate-pulse"></div>
              <div className="h-4 bg-blue-300 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse flex-shrink-0"></div>
        </div>

        {/* Assistant message */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse flex-shrink-0"></div>
          <div className="flex-1 max-w-md">
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-3/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
