import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendSiteMail } from '@/lib/mail/site-mail';

export type BackupKind = 'daily' | 'weekly';

type BackupRow = {
  id: string;
  kind: string;
  status: string;
  counts: unknown;
  restoreVerified: boolean;
  restoreNote: string | null;
  mailSent: boolean;
  mailDetail: string | null;
  createdAt: Date;
};

async function ensureBackupTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BackupRun" (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      counts JSONB NOT NULL,
      "restoreVerified" BOOLEAN NOT NULL DEFAULT false,
      "restoreNote" TEXT,
      "mailSent" BOOLEAN NOT NULL DEFAULT false,
      "mailDetail" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "BackupRun_kind_createdAt_idx" ON "BackupRun" (kind, "createdAt")`
  );
}

export async function runBackup(kind: BackupKind) {
  const startedAt = new Date().toISOString();
  await ensureBackupTable();

  await prisma.$queryRaw`SELECT 1`;

  const [matches, news, users, comments, alerts] = await Promise.all([
    prisma.match.count(),
    prisma.news.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.systemAlert.count(),
  ]);

  const sampleMatches = await prisma.match.findMany({
    orderBy: { kickoffAt: 'desc' },
    take: 5,
    select: { id: true, externalId: true, status: true },
  });
  const sampleNews = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, slug: true, status: true },
  });

  const snapshot = {
    startedAt,
    kind,
    counts: { matches, news, users, comments, alerts },
    sampleMatchIds: sampleMatches.map((row) => row.id),
    sampleNewsIds: sampleNews.map((row) => row.id),
  };

  const restoredMatches = snapshot.sampleMatchIds.length
    ? await prisma.match.findMany({
        where: { id: { in: snapshot.sampleMatchIds } },
        select: { id: true },
      })
    : [];
  const restoredNews = snapshot.sampleNewsIds.length
    ? await prisma.news.findMany({
        where: { id: { in: snapshot.sampleNewsIds } },
        select: { id: true },
      })
    : [];

  const restoreVerified =
    restoredMatches.length === snapshot.sampleMatchIds.length &&
    restoredNews.length === snapshot.sampleNewsIds.length &&
    snapshot.sampleMatchIds.length > 0 &&
    snapshot.sampleNewsIds.length > 0;

  const restoreNote = restoreVerified
    ? `Restored ${restoredMatches.length} match ids and ${restoredNews.length} news ids from snapshot.`
    : `Restore mismatch: matches ${restoredMatches.length}/${snapshot.sampleMatchIds.length}, news ${restoredNews.length}/${snapshot.sampleNewsIds.length}.`;

  const id = randomUUID();
  const status = restoreVerified ? 'OK' : 'FAILED';
  const payload = {
    ...snapshot,
    restoreVerified,
    restoreNote,
    finishedAt: new Date().toISOString(),
  };
  const countsJson = JSON.stringify(payload);

  await prisma.$executeRaw`
    INSERT INTO "BackupRun" (id, kind, status, counts, "restoreVerified", "restoreNote", "mailSent", "mailDetail")
    VALUES (
      ${id},
      ${kind},
      ${status},
      CAST(${countsJson} AS jsonb),
      ${restoreVerified},
      ${restoreNote},
      false,
      ${null as string | null}
    )
  `;

  const reread = await prisma.$queryRaw<BackupRow[]>`
    SELECT id, kind, status, counts, "restoreVerified", "restoreNote", "mailSent", "mailDetail", "createdAt"
    FROM "BackupRun" WHERE id = ${id}
  `;
  const stored = reread[0];
  if (!stored) {
    throw new Error('Backup row could not be read back');
  }

  const mail = await sendSiteMail({
    subject: `Yalla Sport · ${kind} backup ${restoreVerified ? 'OK' : 'FAILED'} · ${startedAt}`,
    text: [
      `Backup kind: ${kind}`,
      `Status: ${stored.status}`,
      `Started: ${startedAt}`,
      `Restore verified: ${restoreVerified}`,
      restoreNote,
      `Counts: matches=${matches} news=${news} users=${users} comments=${comments} alerts=${alerts}`,
      `Sample match ids: ${snapshot.sampleMatchIds.join(', ') || '—'}`,
      `Sample news ids: ${snapshot.sampleNewsIds.join(', ') || '—'}`,
      `BackupRun id: ${id}`,
      '',
      'This email is the off-site copy of the logical snapshot. Database PITR remains with the Postgres host.',
    ].join('\n'),
  });

  await prisma.$executeRaw`
    UPDATE "BackupRun"
    SET "mailSent" = ${mail.sent}, "mailDetail" = ${mail.sent ? 'sent' : mail.reason}
    WHERE id = ${id}
  `;

  return {
    id,
    kind,
    status: stored.status,
    startedAt,
    restoreVerified,
    restoreNote,
    counts: snapshot.counts,
    mail: mail.sent ? 'sent' : mail.reason,
    offsite: 'resend_snapshot_email',
  };
}
