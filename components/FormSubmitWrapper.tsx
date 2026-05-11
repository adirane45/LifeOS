'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button';

interface FormSubmitWrapperProps {
  children: React.ReactNode;
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

/**
 * Client-side wrapper for form submissions with toast notifications
 */
export default function FormSubmitWrapper({
  children,
  action,
  successMessage,
  errorMessage = 'Failed to submit form',
  onSuccess
}: FormSubmitWrapperProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(`✅ ${successMessage}`);
        e.currentTarget.reset();
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        toast.error(`❌ ${message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {children}
      {isPending && <div className="text-sm text-gray-500">Submitting...</div>}
    </form>
  );
}
