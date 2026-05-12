'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Contacts error:', error);
  }, [error]);

  return (
    <section className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contacts</h2>
      </div>
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Unable to load contacts</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{error.message || 'Failed to load contacts.'}</p>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </Card>
    </section>
  );
}
