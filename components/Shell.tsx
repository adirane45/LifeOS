"use client";
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <Sidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setIsMobileOpen((v) => !v)} isMobileMenuOpen={isMobileOpen} />
        <main id="main-content" className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-800">{children}</main>
      </div>
    </div>
  );
}
