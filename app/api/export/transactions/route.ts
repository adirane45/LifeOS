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
  const transactions = await prisma.transaction.findMany({
    where: { account: { userId } },
    orderBy: { date: 'desc' },
    include: { account: true }
  });

  const csv = convertToCSV(
    transactions.map((transaction) => ({
      Date: transaction.date.toISOString(),
      Account: transaction.account?.name ?? '',
      Type: transaction.type,
      Category: transaction.category,
      Amount: transaction.amount.toFixed(2),
      Description: transaction.description ?? ''
    })),
    ['Date', 'Account', 'Type', 'Category', 'Amount', 'Description']
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="transactions.csv"'
    }
  });
}