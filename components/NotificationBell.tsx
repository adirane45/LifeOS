'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import Button from './ui/Button';

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  url?: string | null;
  sentAt: string;
};

function timeAgo(dateValue: string) {
  const diff = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function loadCount() {
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCount(Number(data.count ?? 0));
      }
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
    }
  }

  async function loadRecent() {
    try {
      const res = await fetch('/api/notifications/recent', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    }
  }

  useEffect(() => {
    loadCount();
    const interval = window.setInterval(loadCount, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      await Promise.all([loadCount(), loadRecent()]);
    }
  }

  async function markRead(item: NotificationItem) {
    try {
      await fetch('/api/notifications/unread-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setCount((current) => Math.max(0, current - 1));
    setOpen(false);
    if (item.url) {
      router.push(item.url);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button variant="ghost" size="sm" onClick={toggleOpen} className="relative p-2 text-gray-700 dark:text-gray-200" aria-label="Open notifications">
        <Bell className="h-5 w-5" />
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unread reminders and milestones</p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{count} unread</div>
            </div>
            <div className="max-h-[360px] overflow-auto p-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  <CheckCheck className="h-5 w-5" />
                  Nothing new right now.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => markRead(item)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                        <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">{timeAgo(item.sentAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.body}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
