'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';
import Button from './ui/Button';

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
    <Button
      onClick={toggleCompletion}
      disabled={isPending}
      variant="ghost"
      size="sm"
      className={`h-6 w-6 p-0 inline-flex items-center justify-center rounded-full border-2 ${
        isCompletedOptimistic ? 'border-success bg-success/10' : 'border-gray-300 bg-white hover:border-success'
      }`}
    >
      {isCompletedOptimistic && <Check className="h-4 w-4 text-success" />}
    </Button>
  );
}
