'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button';

export default function RecurringTransactionsButton({ 
  action 
}: { 
  action: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        await action(formData);
        toast.success('✅ Recurring transactions processed successfully');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process recurring transactions';
        toast.error(`❌ ${message}`);
      }
    });
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={isPending}
      variant="secondary" 
      size="sm"
    >
      {isPending ? 'Processing...' : 'Run recurring items'}
    </Button>
  );
}
