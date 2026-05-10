"use client";
import Link from 'next/link';
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
    </div>
  );
}
