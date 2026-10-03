import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/security/http';
import { searchRatelimit } from '@/lib/redis';
import { reportCaughtError } from '@/lib/ops/caught';
import { clampSeekQuery, parseSeekKind } from '@/components/search/seek';
import { runUnifiedSearch } from '@/lib/search/unified';

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await searchRatelimit.limit(`search_${ip}`);
  if (!success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const query = clampSeekQuery(searchParams.get('q'));
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const kind = parseSeekKind(searchParams.get('type') || searchParams.get('kind'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);

  try {
    const pack = await runUnifiedSearch({
      locale,
      query,
      kind,
      page: Number.isFinite(page) ? page : 1,
    });
    return NextResponse.json({
      query: pack.query,
      normalizedQuery: pack.variants[0] || pack.query,
      entities: {
        players: pack.players,
        teams: pack.teams,
        leagues: pack.leagues,
        coaches: pack.coaches,
      },
      matches: [...pack.liveMatches, ...pack.upcomingMatches, ...pack.recentMatches],
      news: pack.news,
      transfers: pack.transfers,
      videos: pack.videos,
      photos: pack.photos,
      counts: pack.counts,
      meta: {
        page: pack.page,
        limit: pack.pageSize,
        suggestion: pack.suggestion,
        primaryPlayer: pack.primaryPlayer,
        primaryTeam: pack.primaryTeam,
      },
    });
  } catch (error) {
    reportCaughtError('src/app/api/search/route.ts', error);
    return NextResponse.json({ query, entities: {}, matches: [], news: [], counts: {} });
  }
}
