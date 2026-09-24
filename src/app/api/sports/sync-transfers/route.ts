import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/security/cron';
import { persistTransfers } from '@/lib/transfers/persist';
import { swallow } from '@/lib/ops/caught';

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const result = await persistTransfers().catch(swallow('sync-transfers', { upserted: 0, clubs: 0 }));
  return NextResponse.json({ success: true, ...result });
}
