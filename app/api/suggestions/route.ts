import { NextResponse } from 'next/server';
import { getDailySuggestions, refreshSuggestions, dismissSuggestion } from '../../../lib/suggestionEngine';
import { getUser } from '../../../lib/data';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json([], { status: 200 });
  const suggestions = await getDailySuggestions(user.id);
  return NextResponse.json(suggestions);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No user' }, { status: 400 });
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'refresh') {
      const refreshed = await refreshSuggestions(user.id);
      return NextResponse.json(refreshed);
    }
    if (body?.action === 'dismiss' && typeof body?.id === 'number') {
      await dismissSuggestion(body.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
