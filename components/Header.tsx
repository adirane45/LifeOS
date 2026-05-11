"use client";
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <button onClick={() => onMenuClick && onMenuClick()} className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">Welcome back</div>
    </header>
  );
}
