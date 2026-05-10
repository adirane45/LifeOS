'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';

export default function HabitCheckbox({ habitId, initialCompleted }: { habitId: number; initialCompleted: boolean }) {
  const [isCompletedOptimistic, setIsCompletedOptimistic] = useOptimistic(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const toggleCompletion = async () => {
    startTransition(async () => {
      setIsCompletedOptimistic(!isCompletedOptimistic);
      
      // Get the user's timezone offset in minutes from UTC
      const timezoneOffsetMinutes = new Date().getTimezoneOffset() * -1;
      
      const res = await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezoneOffsetMinutes })
      });
      
      if (!res.ok) {
        // Revert on error
        setIsCompletedOptimistic(initialCompleted);
      }
    });
  };

  return (
    <button
      onClick={toggleCompletion}
      disabled={isPending}
      className={`inline-flex h-6 w-6 items-center justify-center rounded border-2 transition ${
        isCompletedOptimistic
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-white hover:border-green-400'
      }`}
    >
      {isCompletedOptimistic && <Check className="h-4 w-4 text-green-600" />}
    </button>
  );
}
