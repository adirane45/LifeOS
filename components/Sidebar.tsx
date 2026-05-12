"use client";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../app/auth/serverActions';
import { usePrefersReducedMotion } from '../lib/useMotionPreference';
import {
  Home,
  DollarSign,
  CheckCircle,
  Heart,
  BookOpen,
  MessageSquare,
  Target,
  Settings as SettingsIcon,
  X,
  FileText,
  Users,
  AlarmClock,
  TrendingUp,
  Calculator
} from 'lucide-react';
import Button from './ui/Button';

const mainNav = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Habits', href: '/habits', icon: CheckCircle },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Assistant', href: '/assistant', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: SettingsIcon }
];

const contactsNav = [
  { name: 'All Contacts', href: '/contacts', icon: Users },
  { name: 'Reminders', href: '/contacts/reminders', icon: AlarmClock }
];

const moneyNav = [
  { name: 'Overview', href: '/money', icon: DollarSign },
  { name: 'Accounts', href: '/money/accounts', icon: DollarSign },
  { name: 'Transactions', href: '/money/transactions', icon: DollarSign },
  { name: 'Budgets', href: '/money/budgets', icon: DollarSign },
  { name: 'Bills', href: '/money/bills', icon: FileText },
  { name: 'Split Expenses', href: '/money/splits', icon: Users },
  { name: 'Investments', href: '/money/investments', icon: TrendingUp },
  { name: 'Tax Estimation', href: '/money/tax', icon: Calculator }
];

function SidebarContent({ closeOnNavigate, onClose }: { closeOnNavigate?: boolean; onClose?: () => void }) {
  return (
    <div className="h-full p-4">
      <div className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">LifeOS</div>
      <nav className="space-y-1">
        {mainNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => closeOnNavigate && onClose && onClose()}
            className="flex items-center gap-3 rounded p-2 text-gray-800 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
          >
            <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Contacts</p>
        <nav className="mt-2 space-y-1">
          {contactsNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => closeOnNavigate && onClose && onClose()}
              className="flex items-center gap-3 rounded p-2 pl-4 text-gray-800 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
            >
              <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Money</p>
        <nav className="mt-2 space-y-1">
          {moneyNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => closeOnNavigate && onClose && onClose()}
              className="flex items-center gap-3 rounded p-2 pl-4 text-gray-800 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
            >
              <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <form action={logout} className="mt-6">
        <Button type="submit" variant="ghost" className="flex w-full items-center gap-3 text-left text-sm text-red-600 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8" />
          </svg>
          <span>Logout</span>
        </Button>
      </form>
    </div>
  );
}

export default function Sidebar({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:block w-64 border-r bg-white dark:bg-gray-800 dark:border-gray-700 h-screen">
        <SidebarContent />
      </div>

      {/* Mobile overlay sidebar */}
      <div className="md:hidden">
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => onClose && onClose()}
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={prefersReducedMotion ? {} : { opacity: 1 }}
                exit={prefersReducedMotion ? {} : { opacity: 0 }}
                transition={prefersReducedMotion ? {} : { duration: 0.2 }}
              />
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-64"
                initial={prefersReducedMotion ? {} : { x: '-100%' }}
                animate={prefersReducedMotion ? {} : { x: 0 }}
                exit={prefersReducedMotion ? {} : { x: '-100%' }}
                transition={prefersReducedMotion ? {} : { type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="h-full p-4 bg-white dark:bg-gray-900">
                  <div className="flex justify-end">
                    <Button onClick={() => onClose && onClose()} aria-label="Close sidebar" variant="ghost" size="sm" className="p-2">
                      <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </Button>
                  </div>
                  <SidebarContent closeOnNavigate onClose={onClose} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
