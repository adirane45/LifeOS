import webpush from 'web-push';
import { prisma } from './prisma';

const DAY_MS = 24 * 60 * 60 * 1000;
let pushConfigured = false;

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(later: Date, earlier: Date) {
  return Math.floor((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / DAY_MS);
}

function ensurePushConfigured() {
  if (pushConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails('mailto:lifeos@example.com', publicKey, privateKey);
  pushConfigured = true;
  return true;
}

async function hasLoggedToday(userId: number, type: string, entityId: string) {
  const today = startOfDay(new Date());
  return prisma.notificationLog.findFirst({
    where: {
      userId,
      type,
      entityId,
      sentAt: { gte: today }
    },
    select: { id: true }
  });
}

async function sendNotificationToSubscriptions(userId: number, payload: NotificationPayload) {
  const subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }> = await prisma.pushSubscriptionModel.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true }
  });

  if (subscriptions.length === 0) {
    return;
  }

  const serializedPayload = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth }
          },
          serializedPayload
        );
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    })
  );
}

export async function checkAndSendNotifications() {
  if (!ensurePushConfigured()) {
    console.warn('Push notifications are not configured. Missing VAPID keys.');
    return 0;
  }

  const now = new Date();
  const today = startOfDay(now);
  const lateHour = now.getHours() >= 18;
  const users = await prisma.user.findMany({ select: { id: true } });
  let sentCount = 0;

  for (const user of users) {
    const [bills, contacts, habits, goals] = await Promise.all([
      prisma.bill.findMany({
        where: {
          userId: user.id,
          isPaid: false,
          dueDate: {
            gte: today,
            lte: new Date(today.getTime() + 2 * DAY_MS)
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.contact.findMany({
        where: { userId: user.id },
        orderBy: { lastContacted: 'asc' }
      }),
      prisma.habit.findMany({
        where: { userId: user.id },
        include: {
          logs: {
            where: {
              date: {
                gte: today,
                lt: new Date(today.getTime() + DAY_MS)
              }
            },
            select: { id: true, completed: true }
          }
        }
      }),
      prisma.goal.findMany({
        where: {
          userId: user.id,
          completed: false
        }
      })
    ]);

    for (const bill of bills) {
      const entityId = `bill:${bill.id}`;
      if (await hasLoggedToday(user.id, 'BILL_DUE', entityId)) continue;

      const daysUntil = Math.max(0, daysBetween(bill.dueDate, now));
      const payload: NotificationPayload = {
        title: 'Upcoming bill reminder',
        body: `📅 Your ${bill.name} (${formatCurrency(bill.amount)}) is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`,
        url: '/money/bills'
      };

      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: 'BILL_DUE',
          entityId,
          title: payload.title,
          body: payload.body,
          url: payload.url
        }
      });
      await sendNotificationToSubscriptions(user.id, payload);
      sentCount += 1;
    }

    for (const contact of contacts) {
      const remindAfterDays = Math.max(1, contact.remindAfterDays ?? 30);
      const lastContacted = contact.lastContacted ? new Date(contact.lastContacted) : null;
      const createdAt = new Date(contact.createdAt);
      const staleDays = lastContacted ? daysBetween(now, lastContacted) : daysBetween(now, createdAt);
      const isOverdue = staleDays >= remindAfterDays;
      if (!isOverdue) continue;

      const entityId = `contact:${contact.id}`;
      if (await hasLoggedToday(user.id, 'CONTACT_OVERDUE', entityId)) continue;

      const payload: NotificationPayload = {
        title: 'Contact reminder',
        body: `👋 You haven't contacted ${contact.name} in ${staleDays} days.`,
        url: '/contacts'
      };

      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: 'CONTACT_OVERDUE',
          entityId,
          title: payload.title,
          body: payload.body,
          url: payload.url
        }
      });
      await sendNotificationToSubscriptions(user.id, payload);
      sentCount += 1;
    }

    if (lateHour) {
      for (const habit of habits) {
        const completedToday = (habit.logs || []).some((log: { completed: boolean }) => log.completed);
        if (completedToday) continue;

        const entityId = `habit:${habit.id}`;
        if (await hasLoggedToday(user.id, 'HABIT_NUDGE', entityId)) continue;

        const payload: NotificationPayload = {
          title: 'Habit nudge',
          body: `⏰ Don't forget your '${habit.name}' habit today!`,
          url: '/habits'
        };

        await prisma.notificationLog.create({
          data: {
            userId: user.id,
            type: 'HABIT_NUDGE',
            entityId,
            title: payload.title,
            body: payload.body,
            url: payload.url
          }
        });
        await sendNotificationToSubscriptions(user.id, payload);
        sentCount += 1;
      }
    }

    for (const goal of goals) {
      const target = Number(goal.targetValue ?? 0);
      const current = Number(goal.currentValue ?? 0);
      if (!target || current / target < 0.8) continue;

      const entityId = `goal:${goal.id}`;
      if (await hasLoggedToday(user.id, 'GOAL_MILESTONE', entityId)) continue;

      const progress = Math.round((current / target) * 100);
      const payload: NotificationPayload = {
        title: 'Goal milestone',
        body: `🎯 You're ${progress}% towards '${goal.title}'!`,
        url: '/goals'
      };

      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: 'GOAL_MILESTONE',
          entityId,
          title: payload.title,
          body: payload.body,
          url: payload.url
        }
      });
      await sendNotificationToSubscriptions(user.id, payload);
      sentCount += 1;
    }
  }

  return sentCount;
}

function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₹${Math.round(amount)}`;
  }
}
