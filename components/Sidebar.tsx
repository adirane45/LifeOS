"use client";
import Link from 'next/link';
import { logout } from '../app/auth/serverActions';
import {
  Home,
  DollarSign,
  CheckCircle,
  Heart,
  BookOpen,
  MessageSquare,
  Settings as SettingsIcon
} from 'lucide-react';

const nav = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Money', href: '/money', icon: DollarSign },
  { name: 'Habits', href: '/habits', icon: CheckCircle },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Assistant', href: '/assistant', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: SettingsIcon }
];

export default function Sidebar() {
  return (
    <div className="h-full p-4">
      <div className="mb-8 text-2xl font-bold">LifeOS</div>
      <nav className="space-y-1">
        {nav.map((item) => (
          <Link key={item.name} href={item.href} className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
            <item.icon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-800">{item.name}</span>
          </Link>
        ))}
      </nav>

      <form action={logout} className="mt-6">
        <button type="submit" className="w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-sm text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v8" />
          </svg>
          <span>Logout</span>
        </button>
      </form>
    </div>
  );
}
