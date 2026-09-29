import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere } from '@/lib/i18n/localized-content';
import { dayBoundsInTimezone } from '@/lib/datetime/format';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';
import { swallow } from '@/lib/ops/caught';

export const loadAboutDesk = cache(async function loadAboutDesk(locale: string, todayKey: string, timezone: string) {
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);
  const emptyLive: Array<{
    id: string;
    minute: number | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string };
    awayTeam: { name: string };
    league: { name: string };
  }> = [];

  const [leagues, stories, fixtures, teams, players, live, liveRows, youtubeClips, channels, assets] =
    await Promise.all([
      prisma.league.count().catch(swallow('about.leagues', 0)),
      prisma.news.count({ where: newsVisibleWhere(locale) }).catch(swallow('about.news', 0)),
      prisma.match.count({ where: { kickoffAt: { gte: start, lte: end } } }).catch(swallow('about.today', 0)),
      prisma.team.count().catch(swallow('about.teams', 0)),
      prisma.player.count().catch(swallow('about.players', 0)),
      prisma.match.count({ where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } } }).catch(swallow('about.live', 0)),
      prisma.match
        .findMany({
          where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } },
          take: 4,
          orderBy: { kickoffAt: 'asc' },
          select: {
            id: true,
            minute: true,
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            league: { select: { name: true } },
          },
        })
        .catch(swallow('about.liveRows', emptyLive)),
      prisma.youtubeClip.count({ where: { status: 'PUBLISHED' } }).catch(swallow('about.clips', 0)),
      STREAMING_ENABLED ? prisma.channel.count().catch(swallow('about.channels', 0)) : Promise.resolve(0),
      STREAMING_ENABLED ? prisma.streamAsset.count().catch(swallow('about.assets', 0)) : Promise.resolve(0),
    ]);

  return { leagues, stories, fixtures, teams, players, live, liveRows, youtubeClips, channels, assets };
});
