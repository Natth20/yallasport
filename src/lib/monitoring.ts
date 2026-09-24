import { reportCaughtError } from '@/lib/ops/caught';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { sendSiteMail } from '@/lib/mail/site-mail';
import { redis } from '@/lib/redis';

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertType {
  CRON_FAILURE = 'CRON_FAILURE',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SECURITY_BREACH = 'SECURITY_BREACH',
  BACKUP_FAILED = 'BACKUP_FAILED',
}

function shouldEmail(type: AlertType, severity: AlertSeverity) {
  if (severity === AlertSeverity.CRITICAL) return true;
  if (severity !== AlertSeverity.HIGH) return false;
  return (
    type === AlertType.CRON_FAILURE ||
    type === AlertType.DATABASE_ERROR ||
    type === AlertType.BACKUP_FAILED ||
    type === AlertType.SECURITY_BREACH
  );
}

export async function logSystemAlert(
  type: AlertType,
  severity: AlertSeverity,
  message: string,
  metadata?: Prisma.InputJsonValue
) {
  try {
    await prisma.systemAlert.create({
      data: {
        type,
        severity,
        message,
        metadata: metadata || {}
      }
    });
  } catch (error) {
    console.error('[FATAL_LOGGING_ERROR]:', error);
  }

  if (!shouldEmail(type, severity)) return;

  const dedupKey = `ops_alert:${type}:${severity}:${message.slice(0, 80)}`;
  try {
    const reserved = await redis.set(dedupKey, '1', { nx: true, ex: 1800 });
    if (!reserved) return;
  } catch (error) {
    reportCaughtError("src/lib/monitoring.ts:57", error);
    // Still attempt mail if Redis is down.
  }

  const mail = await sendSiteMail({
    subject: `Yalla Sport · ${severity} ${type}`,
    text: [
      `Type: ${type}`,
      `Severity: ${severity}`,
      `Time: ${new Date().toISOString()}`,
      '',
      message,
      '',
      metadata ? `Metadata: ${JSON.stringify(metadata)}` : '',
    ].join('\n'),
  });
  if (!mail.sent) {
    console.error('[OPS_ALERT_MAIL]:', mail.reason);
  }
}
