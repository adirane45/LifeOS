'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {error.digest && <p className="text-xs text-gray-500">Error ID: {error.digest}</p>}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => reset()} className="flex-1">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="secondary" className="flex-1">
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
