import { NextResponse } from 'next/server';
import { getUser } from '../../../../lib/data';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const subscription = body?.subscription;
    const endpoint = subscription?.endpoint;
    const keys = subscription?.keys;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    await prisma.pushSubscriptionModel.upsert({
      where: { endpoint },
      update: {
        userId: user.id,
        p256dh: String(keys.p256dh),
        auth: String(keys.auth)
      },
      create: {
        userId: user.id,
        endpoint: String(endpoint),
        p256dh: String(keys.p256dh),
        auth: String(keys.auth)
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const endpoint = body?.endpoint;

    if (endpoint) {
      await prisma.pushSubscriptionModel.deleteMany({ where: { userId: user.id, endpoint } });
    } else {
      await prisma.pushSubscriptionModel.deleteMany({ where: { userId: user.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete push subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
