import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { convertToCSV } from '../../../../lib/exportUtils';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lifeos_session')?.value;

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = 1;
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const csv = convertToCSV(
    entries.map((entry: any) => ({
      Date: entry.date.toISOString(),
      Title: entry.title,
      Content: entry.content,
      Mood: entry.mood ?? ''
    })),
    ['Date', 'Title', 'Content', 'Mood']
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="journal.csv"'
    }
  });
}