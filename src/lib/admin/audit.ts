import { prisma } from '@/lib/prisma';
import { reportCaughtError } from '@/lib/ops/caught';

export async function writeAudit(userId: string, action: string, entityType: string, entityId: string) {
  await prisma.auditLog
    .create({
      data: { userId, action, entityType, entityId },
    })
    .catch((error) => {
      reportCaughtError(`audit:${action}`, error);
    });
}
