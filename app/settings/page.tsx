'use client';

import { useTheme } from '../../components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure your LifeOS preferences.</p>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preferences</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</label>
              <div className="mt-2 flex items-center gap-3">
                <Button onClick={toggleTheme} variant="secondary">
                  {theme === 'dark' ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Currency</label>
              <select className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
