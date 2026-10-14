import { prisma } from '@/lib/prisma';
import { UnifiedEvent, SourceHealth, EventsResponse, DataSourceStatus, EventCategory } from './types';

export interface GetEventsOptions {
  timeframe?: 'today' | 'week' | 'month';
  type?: 'all' | 'live' | 'matches' | 'news' | 'major' | 'transfers';
  leagueSlug?: string;
  limit?: number;
}

export async function getUnifiedEvents(options: GetEventsOptions = {}): Promise<EventsResponse> {
  const timeframe = options.timeframe || 'week';
  const typeFilter = options.type || 'all';
  const leagueSlug = options.leagueSlug?.trim();
  const limit = options.limit || 50;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthEnd = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  let dateStart = todayStart;
  let dateEnd = weekEnd;
  if (timeframe === 'today') {
    dateStart = todayStart;
    dateEnd = todayEnd;
  } else if (timeframe === 'month') {
    dateStart = todayStart;
    dateEnd = monthEnd;
  }

  const eventsMap = new Map<string, UnifiedEvent>();
  const sourcesHealth: SourceHealth[] = [];

  // ==========================================
  // SOURCE 1: LIVE IN-PLAY MATCHES (🔴 مباشر)
  // ==========================================
  let liveStatus: DataSourceStatus = 'AVAILABLE';
  let liveCount = 0;
  let liveMessage: string | undefined;

  try {
    const liveMatches = await prisma.match.findMany({
      where: {
        status: { in: ['LIVE', 'HALFTIME'] },
        ...(leagueSlug ? { league: { slug: leagueSlug } } : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
      take: 20,
    });

    liveCount = liveMatches.length;
    for (const match of liveMatches) {
      const home = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const away = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const leagueName = match.league.name || 'البطولة';
      const key = `live_match_${match.id}`;

      eventsMap.set(key, {
        id: key,
        type: 'LIVE',
        title: `${home} 🆚 ${away}`,
        subtitle: `${leagueName} • ${match.venue?.name || ''}`,
        timestamp: match.kickoffAt.toISOString(),
        minute: match.minute || 'مباشر',
        badge: {
          text: match.minute ? `${match.minute}′ مباشر` : 'مباشر الآن',
          textEn: match.minute ? `${match.minute}' LIVE` : 'LIVE NOW',
          color: '#ef4444',
          isPulse: true,
        },
        sourceName: 'Yalla Live Score Gateway',
        sourceStatus: 'AVAILABLE',
        links: {
          match: `/match/${match.id}`,
          league: match.league.slug ? `/league/${match.league.slug}` : undefined,
          team: match.homeTeam.slug ? `/team/${match.homeTeam.slug}` : undefined,
        },
        media: {
          crestHome: match.homeTeam.logoUrl,
          crestAway: match.awayTeam.logoUrl,
          leagueLogo: match.league.logoUrl,
        },
        details: {
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
          homeTeamName: home,
          awayTeamName: away,
          leagueName,
          venue: match.venue?.name,
        },
      });
    }
  } catch (err) {
    liveStatus = 'ERROR';
    liveMessage = err instanceof Error ? err.message : 'Live matches provider error';
  }

  sourcesHealth.push({
    name: 'بيانات البث والمباريات الحية (Live Gateway)',
    category: 'LIVE',
    status: liveStatus,
    lastChecked: now,
    count: liveCount,
    message: liveMessage,
  });

  // ==========================================
  // SOURCE 2: IN-MATCH EVENTS (⚽ أحداث المباريات)
  // Goals, Cards, Substitutions
  // ==========================================
  let inMatchStatus: DataSourceStatus = 'AVAILABLE';
  let inMatchCount = 0;
  let inMatchMessage: string | undefined;

  try {
    const matchEvents = await prisma.matchEvent.findMany({
      where: {
        match: {
          kickoffAt: { gte: new Date(now.getTime() - 24 * 3600 * 1000) },
          ...(leagueSlug ? { league: { slug: leagueSlug } } : {}),
        },
      },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
        player: true,
      },
      orderBy: { minute: 'desc' },
      take: 25,
    });

    inMatchCount = matchEvents.length;
    for (const ev of matchEvents) {
      const match = ev.match;
      const home = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const away = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const playerName = ev.player?.name || ev.playerName || 'لاعب';
      const key = `match_event_${ev.id || ev.sourceKey || `${ev.matchId}_${ev.minute}_${ev.type}`}`;

      let typeLabelAr = 'حدث مباراة';
      let typeLabelEn = 'Match Event';
      let badgeColor = '#3b82f6';

      if (ev.type === 'GOAL') {
        typeLabelAr = '⚽ هدف!';
        typeLabelEn = '⚽ GOAL!';
        badgeColor = '#10b981';
      } else if (ev.type === 'RED_CARD') {
        typeLabelAr = '🟥 بطاقة حمراء';
        typeLabelEn = '🟥 Red Card';
        badgeColor = '#ef4444';
      } else if (ev.type === 'YELLOW_CARD') {
        typeLabelAr = '🟨 بطاقة صفراء';
        typeLabelEn = '🟨 Yellow Card';
        badgeColor = '#f59e0b';
      } else if (ev.type === 'SUBSTITUTION') {
        typeLabelAr = '🔄 تبديل';
        typeLabelEn = '🔄 Substitution';
        badgeColor = '#8b5cf6';
      }

      eventsMap.set(key, {
        id: key,
        type: 'MATCH_EVENT',
        title: `${typeLabelAr} — ${playerName}`,
        subtitle: `${home} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${away} (${match.league.name})`,
        timestamp: match.kickoffAt.toISOString(),
        minute: ev.minute,
        badge: {
          text: `${typeLabelAr} (${ev.minute}′)`,
          textEn: `${typeLabelEn} (${ev.minute}')`,
          color: badgeColor,
        },
        sourceName: 'Sports Fixture Events Stream',
        sourceStatus: 'AVAILABLE',
        links: {
          match: `/match/${match.id}`,
          player: ev.player?.slug ? `/player/${ev.player.slug}` : undefined,
          league: match.league.slug ? `/league/${match.league.slug}` : undefined,
        },
        media: {
          crestHome: match.homeTeam.logoUrl,
          crestAway: match.awayTeam.logoUrl,
          leagueLogo: match.league.logoUrl,
        },
        details: {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeTeamName: home,
          awayTeamName: away,
          playerName,
          leagueName: match.league.name,
        },
      });
    }
  } catch (err) {
    inMatchStatus = 'ERROR';
    inMatchMessage = err instanceof Error ? err.message : 'Match events stream error';
  }

  sourcesHealth.push({
    name: 'أحداث ومجريات المباريات اللحظية (Fixture Events)',
    category: 'MATCH_EVENT',
    status: inMatchCount === 0 && inMatchStatus !== 'ERROR' ? 'PENDING' : inMatchStatus,
    lastChecked: now,
    count: inMatchCount,
    message: inMatchCount === 0 && inMatchStatus !== 'ERROR' ? 'لا توجد أهداف أو بطاقات مسجلة في الساعات الأخيرة' : inMatchMessage,
  });

  // ==========================================
  // SOURCE 3: BREAKING NEWS (📰 الأخبار العاجلة)
  // ==========================================
  let newsStatus: DataSourceStatus = 'AVAILABLE';
  let newsCount = 0;
  let newsMessage: string | undefined;

  try {
    const breakingNews = await prisma.news.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ breaking: true }, { featured: true }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        sourceName: true,
        publishedAt: true,
        breaking: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 15,
    });

    newsCount = breakingNews.length;
    for (const item of breakingNews) {
      const key = `news_${item.id}`;
      eventsMap.set(key, {
        id: key,
        type: 'NEWS',
        title: item.title,
        subtitle: item.excerpt || undefined,
        timestamp: (item.publishedAt || now).toISOString(),
        badge: {
          text: item.breaking ? '🚨 خبر عاجل' : '📰 تطور رياضي',
          textEn: item.breaking ? '🚨 BREAKING NEWS' : '📰 NEWS ALERT',
          color: item.breaking ? '#ef4444' : '#3b82f6',
          isPulse: item.breaking,
        },
        sourceName: item.sourceName || 'يلا سبورت - غرفة الأخبار',
        sourceStatus: 'AVAILABLE',
        links: {
          news: `/news/${item.slug}`,
        },
        media: {
          image: item.featuredImage,
        },
      });
    }
  } catch (err) {
    newsStatus = 'ERROR';
    newsMessage = err instanceof Error ? err.message : 'News feed error';
  }

  sourcesHealth.push({
    name: 'غرفة الأخبار العاجلة والمصادر الموثقة (News Desk)',
    category: 'NEWS',
    status: newsStatus,
    lastChecked: now,
    count: newsCount,
    message: newsMessage,
  });

  // ==========================================
  // SOURCE 4: UPCOMING MAJOR MATCHES & FINALS (🏆 أحداث مهمة)
  // ==========================================
  let majorStatus: DataSourceStatus = 'AVAILABLE';
  let majorCount = 0;
  let majorMessage: string | undefined;

  try {
    const upcomingMatches = await prisma.match.findMany({
      where: {
        kickoffAt: { gte: dateStart, lte: dateEnd },
        status: { notIn: ['LIVE', 'HALFTIME'] },
        ...(leagueSlug ? { league: { slug: leagueSlug } } : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
        venue: true,
      },
      orderBy: { kickoffAt: 'asc' },
      take: 25,
    });

    majorCount = upcomingMatches.length;
    for (const match of upcomingMatches) {
      const home = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const away = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const leagueName = match.league.name || 'البطولة';
      const key = `major_clash_${match.id}`;

      eventsMap.set(key, {
        id: key,
        type: 'MAJOR_EVENT',
        title: `${home} 🆚 ${away}`,
        subtitle: `${leagueName} ${match.round ? `• ${match.round}` : ''}`,
        timestamp: match.kickoffAt.toISOString(),
        badge: {
          text: '🏆 قمة مرتقبة',
          textEn: '🏆 Big Clash',
          color: '#f59e0b',
        },
        sourceName: 'Official Fixtures Schedule',
        sourceStatus: 'AVAILABLE',
        links: {
          match: `/match/${match.id}`,
          league: match.league.slug ? `/league/${match.league.slug}` : undefined,
          team: match.homeTeam.slug ? `/team/${match.homeTeam.slug}` : undefined,
        },
        media: {
          crestHome: match.homeTeam.logoUrl,
          crestAway: match.awayTeam.logoUrl,
          leagueLogo: match.league.logoUrl,
        },
        details: {
          homeTeamName: home,
          awayTeamName: away,
          leagueName,
          venue: match.venue?.name,
        },
      });
    }
  } catch (err) {
    majorStatus = 'ERROR';
    majorMessage = err instanceof Error ? err.message : 'Fixtures calendar error';
  }

  sourcesHealth.push({
    name: 'أجندة القمم والمواعيد الكروية (Match Calendar)',
    category: 'MAJOR_EVENT',
    status: majorCount === 0 && majorStatus !== 'ERROR' ? 'UNAVAILABLE' : majorStatus,
    lastChecked: now,
    count: majorCount,
    message: majorCount === 0 && majorStatus !== 'ERROR' ? 'لا توجد قمم مسجلة في هذا النطاق الزمني' : majorMessage,
  });

  // ==========================================
  // SOURCE 5: TRANSFERS (🔄 الانتقالات)
  // ==========================================
  let transferStatus: DataSourceStatus = 'AVAILABLE';
  let transferCount = 0;
  let transferMessage: string | undefined;

  try {
    const transfers = await prisma.transfer.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        player: true,
      },
    });

    transferCount = transfers.length;
    for (const tr of transfers) {
      const playerName = tr.player.name;
      const key = `transfer_${tr.id}`;
      const subtitle = tr.fromTeam && tr.toTeam
        ? `من ${tr.fromTeam} إلى ${tr.toTeam}`
        : tr.toTeam
        ? `انضم إلى ${tr.toTeam}`
        : 'صفقة مؤكدة';

      eventsMap.set(key, {
        id: key,
        type: 'TRANSFER',
        title: `🔄 انتقال: ${playerName}`,
        subtitle,
        timestamp: tr.date.toISOString(),
        badge: {
          text: '🔄 سوق الانتقالات',
          textEn: '🔄 Transfer Deal',
          color: '#10b981',
        },
        sourceName: 'Official Transfer Wire',
        sourceStatus: 'AVAILABLE',
        links: {
          player: tr.player.slug ? `/player/${tr.player.slug}` : undefined,
          transfer: '/transfers',
        },
        media: {
          crestHome: tr.fromLogo,
          crestAway: tr.toLogo,
        },
        details: {
          playerName,
          fromTeam: tr.fromTeam,
          toTeam: tr.toTeam,
          fee: tr.fee,
        },
      });
    }
  } catch (err) {
    transferStatus = 'ERROR';
    transferMessage = err instanceof Error ? err.message : 'Transfers wire error';
  }

  sourcesHealth.push({
    name: 'سوق الانتقالات والصفقات المؤكدة (Transfers Wire)',
    category: 'TRANSFER',
    status: transferCount === 0 && transferStatus !== 'ERROR' ? 'PENDING' : transferStatus,
    lastChecked: now,
    count: transferCount,
    message: transferCount === 0 && transferStatus !== 'ERROR' ? 'لا توجد صفقات مؤكدة جديدة اليوم' : transferMessage,
  });

  // ==========================================
  // UNIFIED DEDUPLICATION & FILTERING & SORTING
  // ==========================================
  let allEvents = Array.from(eventsMap.values());

  if (typeFilter !== 'all') {
    if (typeFilter === 'live') {
      allEvents = allEvents.filter((e) => e.type === 'LIVE');
    } else if (typeFilter === 'matches') {
      allEvents = allEvents.filter((e) => e.type === 'LIVE' || e.type === 'MATCH_EVENT' || e.type === 'MAJOR_EVENT');
    } else if (typeFilter === 'news') {
      allEvents = allEvents.filter((e) => e.type === 'NEWS');
    } else if (typeFilter === 'major') {
      allEvents = allEvents.filter((e) => e.type === 'MAJOR_EVENT');
    } else if (typeFilter === 'transfers') {
      allEvents = allEvents.filter((e) => e.type === 'TRANSFER');
    }
  }

  // Sort: LIVE events first, then by timestamp descending
  allEvents.sort((a, b) => {
    if (a.type === 'LIVE' && b.type !== 'LIVE') return -1;
    if (b.type === 'LIVE' && a.type !== 'LIVE') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const slicedEvents = allEvents.slice(0, limit);

  return {
    events: slicedEvents,
    sources: sourcesHealth,
    timestamp: now.toISOString(),
    totalCount: allEvents.length,
  };
}
