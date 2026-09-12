import { NextResponse } from 'next/server';
import { getResolvedMatchDetail } from '@/lib/sports-data/match-resolver';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await getResolvedMatchDetail(id, { refresh: true });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    return NextResponse.json(match, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[MATCH_LIVE]', error);
    return NextResponse.json({ error: 'Match unavailable' }, { status: 503 });
  }
}
