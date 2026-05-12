import { NextResponse } from 'next/server';
import { getUser } from '../../../../lib/data';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.notificationLog.count({
      where: { userId: user.id, read: false }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Failed to fetch unread notification count:', error);
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const id = Number(body?.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });
    }

    await prisma.notificationLog.updateMany({
      where: { id, userId: user.id },
      data: { read: true }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
