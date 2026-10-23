import { prisma } from '@/lib/prisma';
import { UnifiedEvent, SourceHealth, EventsResponse, DataSourceStatus, EventCategory } from './types';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';

export interface GetEventsOptions {
  timeframe?: 'today' | 'week' | 'month';
  type?: 'all' | 'live' | 'matches' | 'news' | 'major' | 'transfers';
  leagueSlug?: string;
  limit?: number;
  locale?: string;
}

export async function getUnifiedEvents(options: GetEventsOptions = {}): Promise<EventsResponse> {
  const timeframe = options.timeframe || 'week';
  const typeFilter = options.type || 'all';
  const leagueSlug = options.leagueSlug?.trim();
  const limit = options.limit || 60;
  const locale = options.locale || 'ar';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekStart = new Date(todayStart.getTime() - 4 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthEnd = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  let dateStart = weekStart;
  let dateEnd = weekEnd;
  if (timeframe === 'today') {
    dateStart = todayStart;
    dateEnd = todayEnd;
  } else if (timeframe === 'month') {
    dateStart = monthStart;
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
      const rawHome = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const rawAway = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const rawLeagueName = match.league.name || 'البطولة';
      const home = localizeTeamName(locale, rawHome);
      const away = localizeTeamName(locale, rawAway);
      const leagueName = localizePlainName(locale, rawLeagueName);
      const venue = match.venue?.name ? localizePlainName(locale, match.venue.name) : undefined;
      const key = `live_match_${match.id}`;

      eventsMap.set(key, {
        id: key,
        type: 'LIVE',
        title: `${home} 🆚 ${away}`,
        subtitle: `${leagueName}${venue ? ` • ${venue}` : ''}`,
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
          matchStatus: match.status,
          homeTeamName: home,
          awayTeamName: away,
          leagueName,
          venue,
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
    let matchEvents = await prisma.matchEvent.findMany({
      where: {
        match: {
          kickoffAt: { gte: dateStart, lte: dateEnd },
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
        player: {
          select: {
            id: true,
            name: true,
            slug: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { minute: 'desc' },
      take: 30,
    });

    // If no events in the tight timeframe window, fallback to the latest recorded real match events
    if (matchEvents.length === 0) {
      matchEvents = await prisma.matchEvent.findMany({
        where: {
          ...(leagueSlug ? { match: { league: { slug: leagueSlug } } } : {}),
        },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              league: true,
            },
          },
          player: {
            select: {
              id: true,
              name: true,
              slug: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { minute: 'desc' },
        take: 20,
      });
    }

    inMatchCount = matchEvents.length;
    for (const ev of matchEvents) {
      const match = ev.match;
      const rawHome = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const rawAway = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const rawPlayerName = ev.player?.name || ev.playerName || 'لاعب';
      const rawLeagueName = match.league.name || 'البطولة';
      const home = localizeTeamName(locale, rawHome);
      const away = localizeTeamName(locale, rawAway);
      const playerName = localizePlainName(locale, rawPlayerName);
      const leagueName = localizePlainName(locale, rawLeagueName);
      const assistName = ev.assistName ? localizePlainName(locale, ev.assistName) : undefined;
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

      const assistText = assistName ? ` (صناعة: ${assistName})` : '';

      eventsMap.set(key, {
        id: key,
        type: 'MATCH_EVENT',
        title: `${typeLabelAr} — ${playerName}${assistText}`,
        subtitle: `${home} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${away} • ${leagueName}`,
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
          matchStatus: match.status,
          homeTeamName: home,
          awayTeamName: away,
          playerName,
          playerPhoto: ev.player?.photoUrl,
          assistName,
          detail: ev.detail,
          leagueName,
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
    message: inMatchCount === 0 && inMatchStatus !== 'ERROR' ? 'لا توجد أهداف أو بطاقات مسجلة في هذا النطاق' : inMatchMessage,
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
      take: 20,
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
          text: item.breaking ? '🚨 خبر عاجل' : '📰 تقرير رياضي',
          textEn: item.breaking ? '🚨 BREAKING NEWS' : '📰 NEWS ALERT',
          color: item.breaking ? '#ef4444' : '#2563eb',
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
  // SOURCE 4: MATCHES & MAJOR CLASHES (🏆 قمم ومباريات)
  // ==========================================
  let majorStatus: DataSourceStatus = 'AVAILABLE';
  let majorCount = 0;
  let majorMessage: string | undefined;

  try {
    const matches = await prisma.match.findMany({
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
      orderBy: { kickoffAt: 'desc' },
      take: 35,
    });

    majorCount = matches.length;
    for (const match of matches) {
      const rawHome = match.homeTeam.name || match.homeTeam.officialName || 'فريق';
      const rawAway = match.awayTeam.name || match.awayTeam.officialName || 'فريق';
      const rawLeagueName = match.league.name || 'البطولة';
      const home = localizeTeamName(locale, rawHome);
      const away = localizeTeamName(locale, rawAway);
      const leagueName = localizePlainName(locale, rawLeagueName);
      const venue = match.venue?.name ? localizePlainName(locale, match.venue.name) : undefined;
      const key = `major_clash_${match.id}`;

      let badgeText = '🏆 قمة مرتقبة';
      let badgeTextEn = '🏆 Upcoming';
      let badgeColor = '#3b82f6';

      if (match.status === 'FINISHED') {
        badgeText = '🏁 نتيجة نهائية';
        badgeTextEn = '🏁 Full Time';
        badgeColor = '#10b981';
      } else if (match.status === 'POSTPONED') {
        badgeText = '⚠️ مؤجلة';
        badgeTextEn = '⚠️ Postponed';
        badgeColor = '#6b7280';
      } else if (match.status === 'CANCELLED') {
        badgeText = '❌ ملغاة';
        badgeTextEn = '❌ Cancelled';
        badgeColor = '#ef4444';
      }

      eventsMap.set(key, {
        id: key,
        type: 'MAJOR_EVENT',
        title: `${home} 🆚 ${away}`,
        subtitle: `${leagueName} ${match.round ? `• ${match.round}` : ''}`,
        timestamp: match.kickoffAt.toISOString(),
        badge: {
          text: badgeText,
          textEn: badgeTextEn,
          color: badgeColor,
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
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          matchStatus: match.status,
          homeTeamName: home,
          awayTeamName: away,
          leagueName,
          venue,
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
    const rawTransfers = await prisma.transfer.findMany({
      take: 25,
      orderBy: { date: 'desc' },
      include: {
        player: true,
      },
    });

    // Deduplicate transfers by player + destination
    const seenTransfers = new Set<string>();
    const deduplicatedTransfers: typeof rawTransfers = [];

    for (const tr of rawTransfers) {
      const dedupKey = `${tr.playerId}_${tr.toTeam || ''}_${tr.fromTeam || ''}`;
      if (!seenTransfers.has(dedupKey)) {
        seenTransfers.add(dedupKey);
        deduplicatedTransfers.push(tr);
      }
    }

    transferCount = deduplicatedTransfers.length;
    for (const tr of deduplicatedTransfers) {
      const rawPlayerName = tr.player.name;
      const playerName = localizePlainName(locale, rawPlayerName);
      const fromTeam = tr.fromTeam ? localizeTeamName(locale, tr.fromTeam) : null;
      const toTeam = tr.toTeam ? localizeTeamName(locale, tr.toTeam) : null;
      const key = `transfer_${tr.id}`;
      const subtitle = fromTeam && toTeam
        ? `من ${fromTeam} إلى ${toTeam}`
        : toTeam
        ? `انضم رسمياً إلى ${toTeam}`
        : 'صفقة مؤكدة رسمياً';

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
          playerPhoto: tr.player?.photoUrl,
          fromTeam,
          toTeam,
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
  // UNIFIED FILTERING & SORTING
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
