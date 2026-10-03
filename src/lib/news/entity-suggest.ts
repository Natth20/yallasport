import 'server-only';

import { prisma } from '@/lib/prisma';
import { localizeEntityMap, newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';

export async function suggestNewsEntities(input: {
  newsId: string;
  title: string;
  content: string;
}) {
  const haystack = `${input.title}\n${input.content}`.toLowerCase();
  const [teams, leagues, matches] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true }, take: 400 }),
    prisma.league.findMany({ select: { id: true, name: true }, take: 200 }),
    prisma.match.findMany({
      where: { kickoffAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
      select: {
        id: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      },
      take: 80
    })
  ]);

  const suggestions: Array<{ entityType: string; entityId: string }> = [];

  for (const team of teams) {
    if (team.name && haystack.includes(team.name.toLowerCase())) {
      suggestions.push({ entityType: 'TEAM', entityId: team.id });
    }
  }
  for (const league of leagues) {
    if (league.name && haystack.includes(league.name.toLowerCase())) {
      suggestions.push({ entityType: 'LEAGUE', entityId: league.id });
    }
  }
  for (const match of matches) {
    const home = match.homeTeam.name.toLowerCase();
    const away = match.awayTeam.name.toLowerCase();
    if (haystack.includes(home) && haystack.includes(away)) {
      suggestions.push({ entityType: 'MATCH', entityId: match.id });
    }
  }

  for (const suggestion of suggestions) {
    await prisma.newsEntityLink.upsert({
      where: {
        newsId_entityType_entityId: {
          newsId: input.newsId,
          entityType: suggestion.entityType,
          entityId: suggestion.entityId
        }
      },
      update: {},
      create: {
        newsId: input.newsId,
        entityType: suggestion.entityType,
        entityId: suggestion.entityId,
        suggested: true,
        confirmed: false
      }
    });
  }

  return suggestions;
}

export async function relatedNewsForMatch(matchId: string, locale: string, take = 4) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, homeTeamId: true, awayTeamId: true, leagueId: true }
  });
  if (!match) return [];

  const links = await prisma.newsEntityLink.findMany({
    where: {
      confirmed: true,
      OR: [
        { entityType: 'MATCH', entityId: match.id },
        { entityType: 'TEAM', entityId: match.homeTeamId },
        { entityType: 'TEAM', entityId: match.awayTeamId },
        { entityType: 'LEAGUE', entityId: match.leagueId }
      ]
    },
    include: {
      news: {
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          featuredImage: true,
          category: true,
          publishedAt: true,
          status: true,
          sourceLocale: true
        }
      }
    },
    take: 20
  });

  const unique = new Map<string, (typeof links)[number]['news']>();
  for (const link of links) {
    if (link.news.status !== 'PUBLISHED') continue;
    unique.set(link.news.id, link.news);
  }

  return (await overlayNewsList([...unique.values()], locale)).slice(0, take);
}

export type NewsEntityChip = {
  type: string;
  href: string;
  name: string;
};

export async function linkedEntitiesForNews(newsIds: string[], locale: string) {
  const result = new Map<string, NewsEntityChip[]>();
  if (newsIds.length === 0) return result;

  const links = await prisma.newsEntityLink.findMany({
    where: { newsId: { in: newsIds } },
    orderBy: { createdAt: 'asc' },
  });
  if (links.length === 0) return result;

  const idsFor = (type: string) =>
    [...new Set(links.filter((link) => link.entityType === type).map((link) => link.entityId))];

  const teamIds = idsFor('TEAM');
  const leagueIds = idsFor('LEAGUE');
  const matchIds = idsFor('MATCH');
  const playerIds = idsFor('PLAYER');

  const [teams, leagues, matches, players] = await Promise.all([
    teamIds.length
      ? prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, slug: true } })
      : [],
    leagueIds.length
      ? prisma.league.findMany({ where: { id: { in: leagueIds } }, select: { id: true, name: true, slug: true } })
      : [],
    matchIds.length
      ? prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        })
      : [],
    playerIds.length
      ? prisma.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true, slug: true } })
      : [],
  ]);

  const teamById = new Map(teams.map((row) => [row.id, row]));
  const leagueById = new Map(leagues.map((row) => [row.id, row]));
  const matchById = new Map(matches.map((row) => [row.id, row]));
  const playerById = new Map(players.map((row) => [row.id, row]));

  const named = [
    ...teams.map((row) => ({ entityType: 'TEAM', entityId: row.id, fallback: row.name })),
    ...leagues.map((row) => ({ entityType: 'LEAGUE', entityId: row.id, fallback: row.name })),
    ...players.map((row) => ({ entityType: 'PLAYER', entityId: row.id, fallback: row.name })),
    ...matches.map((row) => ({
      entityType: 'MATCH',
      entityId: row.id,
      fallback: `${row.homeTeam.name} — ${row.awayTeam.name}`,
    })),
  ];
  const labels = await localizeEntityMap(named, locale);

  for (const link of links) {
    const key = `${link.entityType}:${link.entityId}`;
    let chip: NewsEntityChip | null = null;
    if (link.entityType === 'TEAM') {
      const team = teamById.get(link.entityId);
      if (team) chip = { type: 'TEAM', href: `/team/${team.slug}`, name: labels.get(key) || team.name };
    } else if (link.entityType === 'LEAGUE') {
      const league = leagueById.get(link.entityId);
      if (league) chip = { type: 'LEAGUE', href: `/league/${league.slug}`, name: labels.get(key) || league.name };
    } else if (link.entityType === 'PLAYER') {
      const player = playerById.get(link.entityId);
      if (player) chip = { type: 'PLAYER', href: `/player/${player.slug}`, name: labels.get(key) || player.name };
    } else if (link.entityType === 'MATCH') {
      const match = matchById.get(link.entityId);
      if (match) chip = { type: 'MATCH', href: `/match/${match.id}`, name: labels.get(key) || `${match.homeTeam.name} — ${match.awayTeam.name}` };
    }
    if (!chip) continue;
    const list = result.get(link.newsId) ?? [];
    if (list.length >= 3) continue;
    list.push(chip);
    result.set(link.newsId, list);
  }

  return result;
}

export async function latestFootballNews(locale: string, take = 6) {
  const rows = await prisma.news.findMany({
    where: {
      AND: [
        newsVisibleWhere(locale),
        {
          OR: [
            { category: { contains: 'football', mode: 'insensitive' } },
            { category: { contains: 'كرة', mode: 'insensitive' } },
            { tags: { hasSome: ['football', 'soccer', 'كرة القدم'] } }
          ]
        }
      ]
    },
    orderBy: { publishedAt: 'desc' },
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      featuredImage: true,
      category: true,
      publishedAt: true,
      sourceLocale: true
    }
  });
  return overlayNewsList(rows, locale);
}
