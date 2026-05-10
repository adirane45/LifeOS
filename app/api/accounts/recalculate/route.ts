import { NextResponse } from 'next/server';
import { recalculateAllAccountBalances } from '../../../../lib/accountHelpers';

export const dynamic = 'force-dynamic';

export async function POST() {
  const balances = await recalculateAllAccountBalances();
  return NextResponse.json({ balances });
}

export async function GET() {
  const balances = await recalculateAllAccountBalances();
  return NextResponse.json({ balances });
}
