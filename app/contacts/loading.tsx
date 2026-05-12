export default function ContactsLoading() {
  return (
    <section className="space-y-6 p-4">
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-16 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
