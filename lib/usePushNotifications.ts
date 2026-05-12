'use client';

import { useEffect, useState } from 'react';

type SubscriptionState = {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isReady: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<SubscriptionState>({
    permission: 'default',
    isSubscribed: false,
    isReady: false
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) {
          setState((current) => ({ ...current, isReady: true, permission: 'denied' }));
        }
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setState({ permission: Notification.permission, isSubscribed: Boolean(subscription), isReady: true });
        }
      } catch (error) {
        console.error('Failed to register service worker for push notifications:', error);
        if (!cancelled) {
          setState((current) => ({ ...current, isReady: true }));
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  async function requestPermission() {
    if (!('Notification' in window)) {
      setState((current) => ({ ...current, permission: 'denied' }));
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setState((current) => ({ ...current, permission }));
    return permission;
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    const permission = Notification.permission === 'granted' ? 'granted' : await requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      setState((current) => ({ ...current, isSubscribed: true }));
      return true;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    if (!res.ok) {
      throw new Error('Could not save push subscription.');
    }

    setState((current) => ({ ...current, isSubscribed: true }));
    return true;
  }

  async function unsubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
    }

    setState((current) => ({ ...current, isSubscribed: false }));
    return true;
  }

  return {
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    isReady: state.isReady,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
