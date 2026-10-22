import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { cache } from 'react';
import { rotateStart } from '@/lib/front/rotate-shelf';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { galleryImageSrcSet, publicStoryImage, upgradeGalleryImageUrl } from '@/lib/news/enrich-source';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import type { PhotoFrame } from '@/components/photos/PhotoHall';

function categorizeNewsPhoto(
  category: string,
  tags: string[],
  locale: string,
): { group: 'ALL' | 'TOURNAMENT' | 'LEAGUE' | 'MATCH' | 'EVENT'; label: string } {
  const ar = locale === 'ar';
  const catLower = (category || '').toLowerCase();
  const tagsStr = (tags || []).join(' ').toLowerCase();

  // Continental / International Tournaments
  if (
    catLower.includes('champions league') ||
    tagsStr.includes('champions-league') ||
    catLower.includes('europa') ||
    catLower.includes('world cup') ||
    catLower.includes('afcon') ||
    catLower.includes('asian cup') ||
    catLower.includes('international')
  ) {
    return {
      group: 'TOURNAMENT',
      label: ar ? 'دوري أبطال أوروبا والبطولات القارية' : 'Continental Tournaments',
    };
  }

  // Domestic Leagues
  if (
    catLower.includes('premier league') ||
    tagsStr.includes('premier-league') ||
    catLower.includes('la liga') ||
    tagsStr.includes('la-liga') ||
    catLower.includes('serie a') ||
    tagsStr.includes('serie-a') ||
    catLower.includes('bundesliga') ||
    tagsStr.includes('bundesliga') ||
    catLower.includes('ligue 1') ||
    catLower.includes('saudi') ||
    catLower.includes('egyptian')
  ) {
    let leagueName = ar ? 'الدوريات الأوروبية والعربية' : 'Domestic Leagues';
    if (catLower.includes('premier league') || tagsStr.includes('premier-league')) {
      leagueName = ar ? 'الدوري الإنجليزي الممتاز' : 'Premier League';
    } else if (catLower.includes('la liga') || tagsStr.includes('la-liga')) {
      leagueName = ar ? 'الدوري الإسباني (لا ليغا)' : 'La Liga';
    } else if (catLower.includes('serie a') || tagsStr.includes('serie-a')) {
      leagueName = ar ? 'الدوري الإيطالي (سيريا آ)' : 'Serie A';
    } else if (catLower.includes('bundesliga') || tagsStr.includes('bundesliga')) {
      leagueName = ar ? 'الدوري الألماني (بوندسليغا)' : 'Bundesliga';
    } else if (catLower.includes('saudi')) {
      leagueName = ar ? 'دوري روشن السعودي' : 'Saudi Pro League';
    }
    return {
      group: 'LEAGUE',
      label: leagueName,
    };
  }

  // Matches / Game Clashes
  if (
    tagsStr.includes('vs') ||
    tagsStr.includes('derby') ||
    tagsStr.includes('match') ||
    catLower.includes('tactical')
  ) {
    return {
      group: 'MATCH',
      label: ar ? 'لقطات المباريات والقمم الكروية' : 'Match Action & Clashes',
    };
  }

  // Transfers & Market Events
  if (
    catLower.includes('transfer') ||
    tagsStr.includes('transfer') ||
    catLower.includes('contract') ||
    catLower.includes('press')
  ) {
    return {
      group: 'EVENT',
      label: ar ? 'سوق الانتقالات والمؤتمرات' : 'Transfers & Media Events',
    };
  }

  return {
    group: 'EVENT',
    label: ar ? 'أحداث ولحظات الملاعب' : 'Stadium Events & Moments',
  };
}

export const loadPhotoFrames = cache(async function loadPhotoFrames(locale: string): Promise<PhotoFrame[]> {
  const cacheKey = `photos:frames:v5:${locale}`;
  return cachedJson(cacheKey, 90, async () => {
    const imageWhere = {
      OR: [{ featuredImage: { not: null } }, { ogImage: { not: null } }],
    };

    const raw = await prisma.news
      .findMany({
        where: {
          AND: [newsVisibleWhere(locale), imageWhere],
        },
        orderBy: { publishedAt: 'desc' },
        take: 48,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        tags: true,
        featuredImage: true,
        ogImage: true,
        sourceName: true,
        sourceUrl: true,
        sourceLocale: true,
        publishedAt: true,
        entityLinks: {
          select: {
            entityType: true,
            entityId: true,
          },
        },
      },
    })
    .catch(swallow('photos.list', []));

  const fallback =
    raw.length === 0
      ? await prisma.news
          .findMany({
            where: {
              AND: [{ status: 'PUBLISHED', publishedAt: { not: null } }, imageWhere],
            },
            orderBy: { publishedAt: 'desc' },
            take: 48,
            select: {
              id: true,
              slug: true,
              title: true,
              category: true,
              tags: true,
              featuredImage: true,
              ogImage: true,
              sourceName: true,
              sourceUrl: true,
              sourceLocale: true,
              publishedAt: true,
              entityLinks: {
                select: {
                  entityType: true,
                  entityId: true,
                },
              },
            },
          })
          .catch(swallow('photos.list.fallback', []))
      : raw;

  const stories = await overlayNewsList(fallback, locale).catch(swallow('photos.overlay', fallback));

  // Collect team, league, and match IDs from entityLinks to batch query
  const teamIds = new Set<string>();
  const leagueIds = new Set<string>();
  const matchIds = new Set<string>();

  for (const story of stories) {
    const links = (story as any).entityLinks || [];
    for (const link of links) {
      if (link.entityType === 'TEAM') teamIds.add(link.entityId);
      if (link.entityType === 'LEAGUE') leagueIds.add(link.entityId);
      if (link.entityType === 'MATCH') matchIds.add(link.entityId);
    }
  }

  const [teams, leagues, matches] = await Promise.all([
    teamIds.size > 0
      ? prisma.team
          .findMany({
            where: { id: { in: Array.from(teamIds) } },
            select: { id: true, name: true, slug: true, logoUrl: true },
          })
          .catch(swallow('photos.teams', []))
      : Promise.resolve([]),
    leagueIds.size > 0
      ? prisma.league
          .findMany({
            where: { id: { in: Array.from(leagueIds) } },
            select: { id: true, name: true, slug: true, logoUrl: true },
          })
          .catch(swallow('photos.leagues', []))
      : Promise.resolve([]),
    matchIds.size > 0
      ? prisma.match
          .findMany({
            where: { id: { in: Array.from(matchIds) } },
            select: {
              id: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              homeScore: true,
              awayScore: true,
            },
          })
          .catch(swallow('photos.matches', []))
      : Promise.resolve([]),
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const leagueMap = new Map(leagues.map((l) => [l.id, l]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const unique: Array<(typeof stories)[number] & { featuredImage: string }> = [];
  const seen = new Set<string>();
  for (const story of stories) {
    const image = publicStoryImage(story);
    if (!image || seen.has(image)) continue;
    seen.add(image);
    unique.push({ ...story, featuredImage: image });
  }

  const frames: PhotoFrame[] = unique.map((story) => {
    const links = (story as any).entityLinks || [];
    const firstTeamLink = links.find((l: any) => l.entityType === 'TEAM');
    const firstLeagueLink = links.find((l: any) => l.entityType === 'LEAGUE');
    const firstMatchLink = links.find((l: any) => l.entityType === 'MATCH');

    const rawTeam = firstTeamLink ? teamMap.get(firstTeamLink.entityId) : null;
    const rawLeague = firstLeagueLink ? leagueMap.get(firstLeagueLink.entityId) : null;
    const rawMatch = firstMatchLink ? matchMap.get(firstMatchLink.entityId) : null;

    const relatedTeam = rawTeam
      ? {
          name: localizeTeamName(locale, rawTeam.name),
          slug: rawTeam.slug,
          logoUrl: rawTeam.logoUrl,
        }
      : null;

    const relatedLeague = rawLeague
      ? {
          name: localizePlainName(locale, rawLeague.name),
          slug: rawLeague.slug,
          logoUrl: rawLeague.logoUrl,
        }
      : null;

    const relatedMatch = rawMatch
      ? {
          id: rawMatch.id,
          label: `${rawMatch.homeTeam?.name || ''} ${rawMatch.homeScore ?? '–'} : ${rawMatch.awayScore ?? '–'} ${rawMatch.awayTeam?.name || ''}`,
        }
      : null;

    const taxonomy = categorizeNewsPhoto(story.category || '', story.tags || [], locale);

    // If attached to a league or match, reflect in taxonomy
    const finalGroup = relatedMatch ? 'MATCH' : relatedLeague ? (taxonomy.group === 'TOURNAMENT' ? 'TOURNAMENT' : 'LEAGUE') : taxonomy.group;
    const finalLabel = relatedLeague?.name || taxonomy.label;

    return {
      id: story.id,
      slug: story.slug,
      title: story.title,
      image: upgradeGalleryImageUrl(story.featuredImage || ''),
      srcSet: galleryImageSrcSet(story.featuredImage || ''),
      sourceName: story.sourceName,
      publishedAt: story.publishedAt?.toISOString() || '',
      categoryGroup: finalGroup,
      categoryLabel: finalLabel,
      categoryTag: (story.category || '').trim(),
      relatedNewsSlug: story.slug,
      relatedTeam,
      relatedLeague,
      relatedMatch,
    };
  });

  frames.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return frames;
});
});
