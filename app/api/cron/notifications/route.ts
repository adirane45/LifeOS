import { checkAndSendNotifications } from '../../../../lib/notificationScheduler';

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  if (secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const sent = await checkAndSendNotifications();
    return new Response(JSON.stringify({ sent }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Notification cron failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to process notifications' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
