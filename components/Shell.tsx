"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import OnboardingWizard from './OnboardingWizard';

export default function Shell({ children, onboardingCompleted }: { children: React.ReactNode; onboardingCompleted: boolean }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();

  // Show onboarding only on dashboard and not on auth/login pages
  useEffect(() => {
    const shouldShow = !onboardingCompleted && pathname === '/';
    setShowOnboarding(shouldShow);
  }, [onboardingCompleted, pathname]);

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <Sidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header onMenuClick={() => setIsMobileOpen((v) => !v)} isMobileMenuOpen={isMobileOpen} />
        <main id="main-content" className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-800">{children}</main>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard isOpen={showOnboarding} />
    </div>
  );
}
