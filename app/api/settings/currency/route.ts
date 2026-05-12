import { getUser } from '../../../../lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ baseCurrency: 'USD' });
    }

    const preferences = (user.preferences as any) || {};
    const baseCurrency = preferences.baseCurrency || 'USD';
    const defaultRemindAfterDays = Number(preferences.defaultRemindAfterDays ?? 30);

    return NextResponse.json({
      baseCurrency,
      defaultRemindAfterDays: Number.isFinite(defaultRemindAfterDays) && defaultRemindAfterDays > 0 ? Math.floor(defaultRemindAfterDays) : 30
    });
  } catch (error) {
    console.error('Error fetching currency preference:', error);
    return NextResponse.json({ baseCurrency: 'USD', defaultRemindAfterDays: 30 });
  }
}
