import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';

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

/**
 * logSystemAlert - Centralized logging for critical system errors.
 * Stores alerts in the database for admin notification.
 */
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

    // TODO: Integrate with external services (Slack, Email, SMS) 
    // for HIGH or CRITICAL severities.
  } catch (error) {
    console.error('[FATAL_LOGGING_ERROR]:', error);
  }
}
