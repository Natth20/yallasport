import { swallow } from '@/lib/ops/caught';
import 'server-only';

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export type ApiRequestOutcome = 'OK' | 'ERROR' | 'QUOTA';

export async function logApiRequest(input: {
  providerKey: string;
  path: string;
  status?: number | null;
  outcome: ApiRequestOutcome;
  durationMs: number;
  error?: string | null;
  quotaRemaining?: number | null;
  quotaLimit?: number | null;
}) {
  const id = randomUUID();
  const err = input.error ? input.error.slice(0, 500) : null;
  await prisma.$executeRaw`
    INSERT INTO "ApiRequestLog" (id, "providerKey", path, status, outcome, "durationMs", error, "createdAt")
    VALUES (${id}, ${input.providerKey}, ${input.path.slice(0, 240)}, ${input.status ?? null}, ${input.outcome}, ${input.durationMs}, ${err}, NOW())
  `.catch(swallow("src/lib/sports-data/request-log.ts:23", undefined));

  if (input.outcome === 'OK') {
    await prisma.$executeRaw`
      UPDATE "ApiProvider"
      SET "lastSuccessAt" = NOW(),
          "lastError" = NULL,
          "quotaRemaining" = COALESCE(${input.quotaRemaining ?? null}, "quotaRemaining"),
          "quotaLimit" = COALESCE(${input.quotaLimit ?? null}, "quotaLimit")
      WHERE key = ${input.providerKey}
    `.catch(swallow("src/lib/sports-data/request-log.ts:33", undefined));
  } else {
    await prisma.$executeRaw`
      UPDATE "ApiProvider"
      SET "lastError" = ${err ?? input.outcome},
          "quotaRemaining" = COALESCE(${input.quotaRemaining ?? null}, "quotaRemaining")
      WHERE key = ${input.providerKey}
    `.catch(swallow("src/lib/sports-data/request-log.ts:40", undefined));
  }
}
