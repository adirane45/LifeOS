import { NextResponse } from 'next/server';
import { getUser } from '../../../../lib/data';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.notificationLog.findMany({
      where: { userId: user.id, read: false },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: { id: true, title: true, body: true, url: true, sentAt: true }
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch recent notifications:', error);
    return NextResponse.json({ items: [] });
  }
}
