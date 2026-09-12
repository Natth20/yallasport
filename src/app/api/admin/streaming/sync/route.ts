import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { syncLicensedCatalogFromEnv, ingestLicensedCatalog } from '@/lib/streaming/ingest';
import type { LicensedCatalogPayload } from '@/lib/streaming/ingest';

const ADMIN_ROLES = ['SUPER_ADMIN', 'EDITOR'];

export const POST = auth(async function POST(req) {
  if (!req.auth || !ADMIN_ROLES.includes((req.auth.user as { role?: string })?.role || '')) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (body && typeof body === 'object' && (body.channels || body.shows || body.assets)) {
    const counts = await ingestLicensedCatalog(body as LicensedCatalogPayload);
    return NextResponse.json({ success: true, source: 'body', ...counts });
  }

  const result = await syncLicensedCatalogFromEnv();
  if (!result.ok) {
    return NextResponse.json({ success: false, ...result }, { status: 400 });
  }
  return NextResponse.json({ success: true, source: 'env', ...result });
});
