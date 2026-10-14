import { NextResponse } from 'next/server';
import { getUnifiedEvents } from '@/lib/events/service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || 'week') as 'today' | 'week' | 'month';
    const type = (searchParams.get('type') || 'all') as 'all' | 'live' | 'matches' | 'news' | 'major' | 'transfers';
    const leagueSlug = searchParams.get('league') || undefined;

    const data = await getUnifiedEvents({
      timeframe,
      type,
      leagueSlug,
      limit: 60,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
