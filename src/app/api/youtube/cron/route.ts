import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';
import { ingestYoutubeClips } from '@/lib/youtube/ingest';
import { revalidateAfterYoutubeIngest } from '@/lib/cache/revalidate-public';
import { logSystemAlert, AlertType, AlertSeverity } from '@/lib/monitoring';

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await ingestYoutubeClips();
    revalidateAfterYoutubeIngest();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube cron failed';
    await logSystemAlert(AlertType.CRON_FAILURE, AlertSeverity.HIGH, message, { route: '/api/youtube/cron' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
