import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';
import { auth } from '@/lib/auth/auth';
import { isStaffRole } from '@/lib/auth/admin-access';
import { processScheduledSocialQueue } from '@/lib/social/service';
import { logSystemAlert, AlertType, AlertSeverity } from '@/lib/monitoring';

export async function GET(req: Request) {
  const isCronAuth = isAuthorizedCron(req);
  let isStaff = false;

  if (!isCronAuth) {
    const session = await auth();
    if (session?.user?.role && isStaffRole(session.user.role)) {
      isStaff = true;
    }
  }

  if (!isCronAuth && !isStaff) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await processScheduledSocialQueue();

    if (result.failed > 0) {
      await logSystemAlert(
        AlertType.API_ERROR,
        AlertSeverity.MEDIUM,
        `[SOCIAL_SCHEDULER] Failed to publish ${result.failed} scheduled social posts.`,
        { result }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Social cron failed';
    await logSystemAlert(
      AlertType.CRON_FAILURE,
      AlertSeverity.HIGH,
      message,
      { route: '/api/social/cron' }
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
