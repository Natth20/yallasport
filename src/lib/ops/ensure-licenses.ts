import { prisma } from '@/lib/prisma';

const ROWS = [
  {
    type: 'DATA' as const,
    provider: 'API-Sports',
    scope: 'Football fixtures, standings, events, lineups, statistics (API-Football v3)',
    contractReference: 'API-Sports subscriber terms',
    apiCredentialsRef: 'SPORTS_API_KEY',
    status: 'ACTIVE' as const,
  },
  {
    type: 'CONTENT' as const,
    provider: 'Trusted RSS publishers',
    scope: 'News ingest: title, excerpt, and canonical link only (PENDING_REVIEW)',
    contractReference: 'Publisher RSS terms / attribution',
    apiCredentialsRef: null,
    status: 'ACTIVE' as const,
  },
  {
    type: 'STREAMING' as const,
    provider: 'Unconfigured',
    scope: 'No signed broadcast license. STREAMING_ENABLED remains false.',
    contractReference: 'none',
    apiCredentialsRef: null,
    status: 'PENDING' as const,
  },
];

export async function ensureDocumentedLicenses() {
  const results = [];
  for (const row of ROWS) {
    const existing = await prisma.license.findFirst({
      where: { type: row.type, scope: row.scope },
      select: { id: true, apiCredentialsRef: true, status: true, provider: true },
    });
    if (existing) {
      results.push({ action: 'exists', id: existing.id, type: row.type, provider: existing.provider });
      continue;
    }
    const created = await prisma.license.create({
      data: {
        type: row.type,
        provider: row.provider,
        scope: row.scope,
        territory: [],
        startDate: new Date('2026-09-20T00:00:00.000Z'),
        status: row.status,
        contractReference: row.contractReference,
        apiCredentialsRef: row.apiCredentialsRef,
      },
      select: { id: true },
    });
    results.push({ action: 'created', id: created.id, type: row.type, provider: row.provider });
  }
  return results;
}
