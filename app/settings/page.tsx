export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-500">Configure your LifeOS preferences.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-medium">Preferences</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select className="mt-1 w-full rounded border px-3 py-2">
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <select className="mt-1 w-full rounded border px-3 py-2">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
          <div>
            <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
          </div>
        </div>
      </div>
    </section>
  );
}
