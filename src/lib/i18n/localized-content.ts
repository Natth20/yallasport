import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { hostFromUrl, isTrustedNewsHost, TRUSTED_NEWS_HOSTS } from '@/lib/news/trusted-sources';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';

function trustedSourceUrlClause(): Prisma.NewsWhereInput {
  return {
    OR: TRUSTED_NEWS_HOSTS.flatMap((host) => [
      { sourceUrl: { contains: `://${host}/` } },
      { sourceUrl: { contains: `://www.${host}/` } },
    ]),
  };
}

/** Drop interactive / quiz fluff that sometimes rides trusted sports feeds. */
function editorialTitleClause(): Prisma.NewsWhereInput {
  return {
    NOT: {
      OR: [
        { title: { contains: 'Who am I', mode: 'insensitive' } },
        { title: { contains: 'من أنا' } },
        { title: { contains: 'quiz', mode: 'insensitive' } },
        { title: { contains: 'Crossword', mode: 'insensitive' } },
        { title: { contains: 'اختبر معرفتك' } },
        { title: { contains: 'خمّن' } },
        { title: { contains: 'Guess the', mode: 'insensitive' } },
        { title: { contains: 'Fantasy', mode: 'insensitive' } },
      ],
    },
  };
}

/** Published + dated + real URL from an allowlisted news host. */
export function publishedNewsWhere(): Prisma.NewsWhereInput {
  return {
    status: 'PUBLISHED',
    publishedAt: { not: null, lte: new Date() },
    sourceUrl: { not: null },
    AND: [trustedSourceUrlClause(), editorialTitleClause()],
  };
}

export function newsVisibleWhere(_locale: string): Prisma.NewsWhereInput {
  return publishedNewsWhere();
}

export function isPublicTrustedStory(story: { sourceUrl?: string | null }) {
  return isTrustedNewsHost(hostFromUrl(story.sourceUrl));
}

export async function overlayNewsTranslation<
  T extends {
    id: string;
    title: string;
    excerpt?: string | null;
    content?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    sourceLocale?: string | null;
  }
>(record: T, locale: string): Promise<T> {
  const sourceLocale = record.sourceLocale || 'ar';
  if (locale === sourceLocale) return record;

  const translation = await prisma.newsTranslation.findUnique({
    where: { newsId_locale: { newsId: record.id, locale } },
  });
  if (!translation || (translation.status !== 'APPROVED' && translation.status !== 'DRAFT')) return record;

  return {
    ...record,
    title: translation.title,
    excerpt: translation.excerpt ?? record.excerpt,
    content: translation.content ?? record.content,
    seoTitle: translation.seoTitle ?? record.seoTitle,
    seoDescription: translation.seoDescription ?? record.seoDescription,
  };
}

export async function overlayNewsList<
  T extends { id: string; title: string; excerpt?: string | null; sourceLocale?: string | null }
>(records: T[], locale: string) {
  if (records.length === 0) return records;
  const translations = await prisma.newsTranslation.findMany({
    where: {
      newsId: { in: records.map((item) => item.id) },
      locale,
      status: { in: ['APPROVED', 'DRAFT'] },
    },
  });
  const byNews = new Map<string, (typeof translations)[number]>();
  for (const item of translations) {
    const current = byNews.get(item.newsId);
    if (!current || item.status === 'APPROVED') byNews.set(item.newsId, item);
  }
  return records.map((record) => {
    if ((record.sourceLocale || 'ar') === locale) return record;
    const translation = byNews.get(record.id);
    if (!translation) return record;
    return {
      ...record,
      title: translation.title,
      excerpt: translation.excerpt ?? record.excerpt,
    };
  });
}

export async function localizeEntityMap(
  entities: Array<{ entityType: string; entityId: string; fallback: string }>,
  locale: string
) {
  const map = new Map<string, string>();
  if (entities.length === 0) return map;
  const rows = await prisma.entityTranslation.findMany({
    where: {
      status: 'APPROVED',
      locale,
      OR: entities.map((entity) => ({
        entityType: entity.entityType,
        entityId: entity.entityId,
      })),
    },
  });
  const approved = new Map(rows.map((row) => [`${row.entityType}:${row.entityId}`, row.name]));
  for (const entity of entities) {
    const key = `${entity.entityType}:${entity.entityId}`;
    map.set(key, approved.get(key) || localizePlainName(locale, entity.fallback));
  }
  return map;
}

type NamedTeam = { id: string; name: string };
type NamedLeague = { id: string; name: string; country?: string | null };
type NamedMatch = {
  homeTeam: NamedTeam;
  awayTeam: NamedTeam;
  league: NamedLeague;
  venue?: string;
  events?: Array<{ player?: string; assistPlayer?: string; playerId?: string }>;
  lineups?: Array<{
    players?: Array<{ id: string; name: string }>;
    bench?: Array<{ id: string; name: string }>;
    coach?: { id?: string; name: string };
  }>;
  referee?: { name: string };
  venueDetail?: { name: string; city?: string };
  channels?: Array<{ name: string }>;
};

export async function paintNormalizedMatches(locale: string, matches: NamedMatch[]) {
  const entities = matches.flatMap((match) => [
    { entityType: 'TEAM', entityId: match.homeTeam.id, fallback: match.homeTeam.name },
    { entityType: 'TEAM', entityId: match.awayTeam.id, fallback: match.awayTeam.name },
    { entityType: 'LEAGUE', entityId: match.league.id, fallback: match.league.name },
  ]);
  const map = await localizeEntityMap(entities, locale);
  for (const match of matches) {
    match.homeTeam.name = map.get(`TEAM:${match.homeTeam.id}`) || match.homeTeam.name;
    match.awayTeam.name = map.get(`TEAM:${match.awayTeam.id}`) || match.awayTeam.name;
    match.league.name = map.get(`LEAGUE:${match.league.id}`) || match.league.name;
    if (match.league.country) match.league.country = localizePlainName(locale, match.league.country);
    if (match.venue) match.venue = localizePlainName(locale, match.venue);
    if (match.referee) match.referee.name = localizePlainName(locale, match.referee.name);
    if (match.venueDetail) {
      match.venueDetail.name = localizePlainName(locale, match.venueDetail.name);
      if (match.venueDetail.city) match.venueDetail.city = localizePlainName(locale, match.venueDetail.city);
    }
    for (const channel of match.channels || []) {
      channel.name = localizePlainName(locale, channel.name);
    }
    for (const event of match.events || []) {
      if (event.player) event.player = localizePlainName(locale, event.player);
      if (event.assistPlayer) event.assistPlayer = localizePlainName(locale, event.assistPlayer);
    }
    for (const lineup of match.lineups || []) {
      for (const player of [...(lineup.players || []), ...(lineup.bench || [])]) {
        player.name = localizePlainName(locale, player.name);
      }
      if (lineup.coach) lineup.coach.name = localizePlainName(locale, lineup.coach.name);
    }
  }
}
