import { getUser } from '../../../../lib/data';

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const preferences = (user.preferences as any) || {};
    const regime = preferences.preferredTaxRegime || 'NEW';
    const country = preferences.taxCountry || 'India';

    return Response.json({ regime, country });
  } catch (error) {
    console.error('Failed to get tax preferences:', error);
    return Response.json({ error: 'Failed to get tax preferences' }, { status: 500 });
  }
}
