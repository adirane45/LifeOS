'use client';

import toast from 'react-hot-toast';
import Button from './ui/Button';
import Card from './ui/Card';
import { BellRing, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../lib/usePushNotifications';

export default function NotificationToggle() {
  const { isReady, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  async function handleToggle() {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success('Notifications turned off');
        return;
      }

      const enabled = await subscribe();
      if (enabled) {
        toast.success('Notifications enabled');
      } else {
        toast('Enable browser notifications to receive reminders.');
      }
    } catch (error) {
      console.error('Notification toggle failed:', error);
      toast.error('Could not update notification settings.');
    }
  }

  const status = !isReady
    ? 'Checking browser support...'
    : isSubscribed
      ? 'Push notifications are enabled.'
      : permission === 'denied'
        ? 'Notifications are blocked in this browser.'
        : 'Notifications are off.';

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Browser reminders</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Receive push notifications for bills, contacts, habits, and goals.</p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">{status}</p>
        </div>

        <Button variant={isSubscribed ? 'secondary' : 'primary'} onClick={handleToggle} disabled={!isReady} className="min-w-[140px]">
          {!isReady ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="h-4 w-4" />
              Disable
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4" />
              Enable
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
