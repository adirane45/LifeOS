'use client';
import { useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { AlertCircle } from 'lucide-react';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Tax error:', error); }, [error]);
  return <section className="space-y-6 p-4"><div><h2 className="text-2xl font-bold">Tax Estimation</h2></div><Card><div className="space-y-4"><div className="flex items-center gap-3"><AlertCircle className="h-6 w-6 text-red-600" /><h3 className="text-lg font-semibold">Unable to load tax data</h3></div><p className="text-sm">{error.message || 'Failed to load tax estimation.'}</p><Button onClick={() => reset()}>Try Again</Button></div></Card></section>;
}
