"use client";
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <Sidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex-1 min-h-screen flex flex-col">
        <Header onMenuClick={() => setIsMobileOpen((v) => !v)} />
        <main className="p-6 bg-gray-50 dark:bg-gray-800 flex-1">{children}</main>
      </div>
    </div>
  );
}
