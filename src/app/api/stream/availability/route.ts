import { NextResponse } from 'next/server';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { listLiveCatalog } from '@/lib/streaming/catalog';
import { countryFromHeaders } from '@/lib/streaming/entitlement';

export async function GET(req: Request) {
  if (!STREAMING_ENABLED) {
    return NextResponse.json({ enabled: false, items: [] });
  }
  const url = new URL(req.url);
  const items = await listLiveCatalog({
    country: countryFromHeaders(req.headers),
    leagueId: url.searchParams.get('leagueId') || undefined,
    channelId: url.searchParams.get('channelId') || undefined
  });
  return NextResponse.json({
    enabled: true,
    items: items.map((item) => ({
      id: item.id,
      status: item.status,
      protocol: item.protocol,
      channel: item.channel?.name ?? null,
      match: item.match
        ? {
            id: item.match.id,
            home: item.match.homeTeam.name,
            away: item.match.awayTeam.name,
            league: item.match.league.name
          }
        : null
    }))
  });
}
