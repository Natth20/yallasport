import { NextResponse } from 'next/server';
import { logSystemAlert, AlertType, AlertSeverity } from '@/lib/monitoring';
import { isAuthorizedCron } from '@/lib/security/cron';
import { runBackup, type BackupKind } from '@/lib/ops/backup';

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const kind: BackupKind = url.searchParams.get('kind') === 'weekly' ? 'weekly' : 'daily';

  try {
    const result = await runBackup(kind);
    if (!result.restoreVerified) {
      await logSystemAlert(
        AlertType.BACKUP_FAILED,
        AlertSeverity.CRITICAL,
        `Backup restore check failed (${kind}): ${result.restoreNote}`,
        { backupId: result.id, counts: result.counts }
      );
    }
    return NextResponse.json({
      success: result.restoreVerified,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    await logSystemAlert(AlertType.BACKUP_FAILED, AlertSeverity.CRITICAL, `Backup failed (${kind}): ${message}`);
    return NextResponse.json({ success: false, error: message, kind }, { status: 500 });
  }
}
