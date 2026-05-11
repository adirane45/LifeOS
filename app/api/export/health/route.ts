import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { convertToCSV } from '../../../../lib/exportUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lifeos_session')?.value;

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = 1;
  const metrics = await prisma.healthMetric.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  const csv = convertToCSV(
    metrics.map((metric) => ({
      Date: metric.date.toISOString(),
      Type: metric.type,
      Value: metric.value.toFixed(1),
      Unit: metric.unit ?? ''
    })),
    ['Date', 'Type', 'Value', 'Unit']
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="health.csv"'
    }
  });
}