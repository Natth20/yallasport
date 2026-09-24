import { swallow } from '@/lib/ops/caught';
import type { NormalizedMatch, NormalizedMatchDetail } from './types';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { randomUUID } from 'crypto';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';

export async function rememberArabicDisplay(entityType: 'TEAM' | 'LEAGUE' | 'PLAYER', entityId: string, official: string) {
  const arabic = localizePlainName('ar', official);
  if (!arabic || arabic === official) return;
  await prisma.entityTranslation
    .upsert({
      where: { entityType_entityId_locale: { entityType, entityId, locale: 'ar' } },
      update: { name: arabic, status: 'APPROVED' },
      create: {
        entityType,
        entityId,
        locale: 'ar',
        name: arabic,
        status: 'APPROVED',
        source: 'MACHINE',
      },
    })
    .catch(swallow(`src/lib/sports-data/persistence.ts:${entityType}`, null));
}

const stableSlug = (slug: string, externalId: string) =>
  `${slug || 'entity'}-${externalId}`.toLowerCase();

const lineupJson = (lineup: NormalizedMatchDetail['lineups'][number]) =>
  JSON.parse(JSON.stringify({
    players: lineup.players,
    bench: lineup.bench,
    coach: lineup.coach,
  })) as Prisma.InputJsonValue;

function isUniqueConflict(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

async function upsertTeam(input: {
  externalId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}) {
  const externalId = String(input.externalId);
  const data = {
    name: input.name,
    logoUrl: input.logoUrl ?? null,
  };

  try {
    const row = await prisma.team.upsert({
      where: { externalId },
      update: data,
      create: {
        externalId,
        name: input.name,
        slug: stableSlug(input.slug, externalId),
        logoUrl: input.logoUrl ?? null,
      },
    });
    await prisma.$executeRaw`UPDATE "Team" SET "officialName" = ${input.name} WHERE id = ${row.id}`.catch(swallow("src/lib/sports-data/persistence.ts:48", null));
    await rememberArabicDisplay('TEAM', row.id, input.name);
    return row;
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const row = await prisma.team.update({
      where: { externalId },
      data,
    });
    await prisma.$executeRaw`UPDATE "Team" SET "officialName" = ${input.name} WHERE id = ${row.id}`.catch(swallow("src/lib/sports-data/persistence.ts:56", null));
    await rememberArabicDisplay('TEAM', row.id, input.name);
    return row;
  }
}

async function upsertLeague(input: {
  externalId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  country?: string | null;
}) {
  const externalId = String(input.externalId);
  const update = {
    name: input.name,
    logoUrl: input.logoUrl ?? null,
    ...(input.country ? { country: input.country } : {}),
  };

  try {
    const row = await prisma.league.upsert({
      where: { externalId },
      update,
      create: {
        externalId,
        name: input.name,
        slug: stableSlug(input.slug, externalId),
        logoUrl: input.logoUrl ?? null,
        country: input.country,
      },
    });
    await prisma.$executeRaw`
      UPDATE "League"
      SET "officialName" = ${input.name}, "sportId" = 'sport_football'
      WHERE id = ${row.id}
    `.catch(swallow("src/lib/sports-data/persistence.ts:91", null));
    await rememberArabicDisplay('LEAGUE', row.id, input.name);
    return row;
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const row = await prisma.league.update({
      where: { externalId },
      data: update,
    });
    await prisma.$executeRaw`
      UPDATE "League"
      SET "officialName" = ${input.name}, "sportId" = 'sport_football'
      WHERE id = ${row.id}
    `.catch(swallow("src/lib/sports-data/persistence.ts:103", null));
    await rememberArabicDisplay('LEAGUE', row.id, input.name);
    return row;
  }
}

export async function persistNormalizedMatch(match: NormalizedMatch) {
  const externalId = String(match.externalId);
  const homeTeam = await upsertTeam({
    externalId: match.homeTeam.externalId,
    name: match.homeTeam.name,
    slug: match.homeTeam.slug,
    logoUrl: match.homeTeam.logoUrl,
  });
  const awayTeam = await upsertTeam({
    externalId: match.awayTeam.externalId,
    name: match.awayTeam.name,
    slug: match.awayTeam.slug,
    logoUrl: match.awayTeam.logoUrl,
  });
  const league = await upsertLeague({
    externalId: match.league.externalId,
    name: match.league.name,
    slug: match.league.slug,
    logoUrl: match.league.logoUrl,
    country: match.league.country,
  });

  const payload = {
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    leagueId: league.id,
    status: match.status,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    minute: match.minute ?? null,
    kickoffAt: new Date(match.kickoffAt),
    lastSyncedAt: new Date(),
  };

  let saved;
  try {
    saved = await prisma.match.upsert({
      where: { externalId },
      update: payload,
      create: {
        externalId,
        ...payload,
        seasonId: String(new Date(match.kickoffAt).getUTCFullYear()),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    saved = await prisma.match.update({
      where: { externalId },
      data: payload,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });
  }

  if (match.round) {
    await prisma.$executeRaw`UPDATE "Match" SET "round" = ${match.round} WHERE id = ${saved.id}`.catch(swallow("src/lib/sports-data/persistence.ts:172", undefined));
  }

  const seasonYear = new Date(saved.kickoffAt).getUTCFullYear();
  await prisma.$executeRaw`UPDATE "Match" SET "sportId" = 'sport_football' WHERE id = ${saved.id}`.catch(swallow("src/lib/sports-data/persistence.ts:176", undefined));
  await prisma.$executeRaw`
    INSERT INTO "CompetitionSeason" (id, "leagueId", year, "isCurrent")
    VALUES (${randomUUID()}, ${saved.leagueId}, ${seasonYear}, true)
    ON CONFLICT ("leagueId", year) DO NOTHING
  `.catch(swallow("src/lib/sports-data/persistence.ts:181", undefined));
  await prisma.$executeRaw`
    INSERT INTO "SportEvent" (id, "sportId", "competitionId", "seasonYear", "matchId", "kickoffAt", status)
    VALUES (${randomUUID()}, 'sport_football', ${saved.leagueId}, ${seasonYear}, ${saved.id}, ${saved.kickoffAt}, ${saved.status})
    ON CONFLICT ("matchId") DO UPDATE SET
      "kickoffAt" = EXCLUDED."kickoffAt",
      status = EXCLUDED.status
  `.catch(swallow("src/lib/sports-data/persistence.ts:188", undefined));

  return saved;
}

export async function resolveDatabaseMatchId(publicId: string) {
  const existing = await prisma.match.findFirst({
    where: { OR: [{ id: publicId }, { externalId: publicId }] },
    select: { id: true, externalId: true },
  });

  return existing ?? null;
}

export async function persistMatchDetail(detail: NormalizedMatchDetail) {
  const dbMatch = await persistNormalizedMatch(detail);

  if (typeof detail.attendance === 'number') {
    await prisma.$executeRaw`UPDATE "Match" SET "attendance" = ${detail.attendance} WHERE id = ${dbMatch.id}`.catch(swallow("src/lib/sports-data/persistence.ts:206", null));
  }

  await prisma.$transaction([
    ...detail.events.map((event) =>
      prisma.matchEvent.upsert({
        where: {
          sourceKey: event.id
            ? `${detail.externalId}:${event.id}`
            : `${detail.externalId}:${event.type}:${event.minute}:${event.teamId}:${event.playerId ?? event.player ?? ''}`,
        },
        update: {
          type: event.type,
          minute: event.minute,
          extraMinute: event.extraMinute,
          playerName: event.player,
          assistName: event.assistPlayer,
          teamId: event.teamId,
          detail: event.detail,
        },
        create: {
          sourceKey: event.id
            ? `${detail.externalId}:${event.id}`
            : `${detail.externalId}:${event.type}:${event.minute}:${event.teamId}:${event.playerId ?? event.player ?? ''}`,
          matchId: dbMatch.id,
          type: event.type,
          minute: event.minute,
          extraMinute: event.extraMinute,
          playerName: event.player,
          assistName: event.assistPlayer,
          teamId: event.teamId,
          detail: event.detail,
        },
      })
    ),
    ...detail.lineups.map((lineup) =>
      prisma.matchLineup.upsert({
        where: {
          matchId_teamId_isPredicted: {
            matchId: dbMatch.id,
            teamId: lineup.teamId,
            isPredicted: lineup.status === 'PREDICTED',
          },
        },
        update: {
          formation: lineup.formation,
          playersJson: lineupJson(lineup),
          source: lineup.source,
        },
        create: {
          matchId: dbMatch.id,
          teamId: lineup.teamId,
          formation: lineup.formation,
          playersJson: lineupJson(lineup),
          isPredicted: lineup.status === 'PREDICTED',
          source: lineup.source,
        },
      })
    ),
    ...detail.statistics.map((statistic) =>
      prisma.matchStatistic.upsert({
        where: {
          matchId_teamId: { matchId: dbMatch.id, teamId: statistic.teamId },
        },
        update: {
          possession: statistic.possession,
          shotsOnTarget: statistic.shotsOnTarget,
          shotsOffTarget: statistic.shotsOffTarget,
          corners: statistic.corners,
          offsides: statistic.offsides,
          fouls: statistic.fouls,
        },
        create: {
          matchId: dbMatch.id,
          teamId: statistic.teamId,
          possession: statistic.possession,
          shotsOnTarget: statistic.shotsOnTarget,
          shotsOffTarget: statistic.shotsOffTarget,
          corners: statistic.corners,
          offsides: statistic.offsides,
          fouls: statistic.fouls,
        },
      })
    ),
  ]);

  return dbMatch;
}
