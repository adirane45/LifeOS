'use client';

import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';

type Suggestion = { id: number; text: string; icon: string; action?: { label: string; url: string } };

export default function DashboardSuggestions({ initial = [] }: { initial: Suggestion[] }) {
  const [items, setItems] = useState<Suggestion[]>(initial || []);
  const [loading, setLoading] = useState(false);

  async function handleDismiss(id: number) {
    // optimistic remove with animation
    setItems((cur) => cur.filter((i) => i.id !== id));
    try {
      await fetch('/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dismiss', id }) });
    } catch (err) {
      // ignore
    }
  }

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Suggestions for you</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700" onClick={handleRefresh} aria-label="Refresh suggestions">🔄 {loading ? '...' : 'Refresh'}</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <AnimatePresence initial={false}>
          {items.map((s) => {
            const Icon = (Lucide as any)[s.icon] ?? Lucide.Lightbulb;
            return (
              <motion.div key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="min-w-[260px]">
                <Card className="flex items-start gap-3 p-4">
                  <div className="flex-shrink-0">
                    <span aria-hidden>
                      <Icon className="h-6 w-6 text-indigo-500" />
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-200"><strong>{s.text.split('. ')[0]}</strong> {s.text.split('. ').slice(1).join('. ')}</p>
                    <div className="mt-3 flex items-center gap-3">
                      {s.action ? (
                        <a href={s.action.url} className="text-sm text-blue-600 hover:underline">{s.action.label}</a>
                      ) : null}
                      <button onClick={() => handleDismiss(s.id)} aria-label="Dismiss suggestion" className="ml-auto text-gray-400 hover:text-gray-700">✕</button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
