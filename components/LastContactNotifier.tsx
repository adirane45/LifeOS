'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button';

const SESSION_KEY = 'lifeos-last-contact-notifier-shown';

export default function LastContactNotifier({ overdueCount }: { overdueCount: number }) {
  useEffect(() => {
    if (overdueCount <= 0) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const alreadyShown = window.sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown === '1') {
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, '1');

    toast.custom((toastState) => (
      <div className={`rounded-xl border border-amber-200 bg-white p-4 shadow-lg dark:border-amber-500/40 dark:bg-gray-900 ${toastState.visible ? 'animate-enter' : 'animate-leave'}`}>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">You have {overdueCount} contact{overdueCount === 1 ? '' : 's'} to catch up with.</p>
        <div className="mt-2">
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center justify-center text-sm"
            onClick={() => {
              toast.dismiss(toastState.id);
              window.location.href = '/contacts/reminders';
            }}
          >
            View Reminders
          </Button>
        </div>
      </div>
    ));
  }, [overdueCount]);

  return null;
}