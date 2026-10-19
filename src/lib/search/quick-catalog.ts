import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';

export interface CatalogTeam {
  id: string;
  name: string;
  officialName: string | null;
  slug: string;
  logoUrl: string | null;
  externalId: string;
  country: string | null;
  leagueName: string | null;
}

export interface CatalogPlayer {
  id: string;
  name: string;
  officialName: string | null;
  slug: string;
  photoUrl: string | null;
  position: string | null;
  nationality: string | null;
  teamName: string | null;
  teamId: string | null;
}

export interface CatalogLeague {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  externalId: string | null;
}

export interface CatalogCoach {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  nationality: string | null;
  teamName: string | null;
  teamId: string | null;
}

export interface QuickCatalog {
  teams: CatalogTeam[];
  players: CatalogPlayer[];
  leagues: CatalogLeague[];
  coaches: CatalogCoach[];
  loadedAt: number;
}

import fs from 'node:fs';
import path from 'node:path';

function loadDiskCatalog(): QuickCatalog | null {
  try {
    const diskPath = path.join(process.cwd(), 'src', 'lib', 'search', 'catalog-cache.json');
    if (fs.existsSync(diskPath)) {
      const raw = fs.readFileSync(diskPath, 'utf8');
      return JSON.parse(raw) as QuickCatalog;
    }
  } catch {
    // fallback
  }
  return null;
}

let catalogCache: QuickCatalog | null = loadDiskCatalog();
let loadPromise: Promise<QuickCatalog> | null = null;

export async function getQuickCatalog(): Promise<QuickCatalog> {
  if (catalogCache) {
    return catalogCache;
  }

  // Prevent concurrent multi-fetch
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const [rawTeams, rawPlayers, leagues, rawCoaches] = await Promise.all([
        prisma.team
          .findMany({
            select: {
              id: true,
              name: true,
              officialName: true,
              slug: true,
              logoUrl: true,
              externalId: true,
              standings: {
                orderBy: { seasonId: 'desc' },
                take: 1,
                select: { league: { select: { name: true, country: true } } },
              },
            },
            take: 4000,
          })
          .catch(swallow('catalog.teams', [])),

        prisma.player
          .findMany({
            select: {
              id: true,
              name: true,
              officialName: true,
              slug: true,
              photoUrl: true,
              position: true,
              nationality: true,
              teams: {
                where: { to: null },
                take: 1,
                select: { team: { select: { id: true, name: true } } },
              },
            },
            take: 2500,
          })
          .catch(swallow('catalog.players', [])),

        prisma.league
          .findMany({
            select: { id: true, name: true, slug: true, logoUrl: true, country: true, externalId: true },
            take: 600,
          })
          .catch(swallow('catalog.leagues', [])),

        prisma.coach
          .findMany({
            select: {
              id: true,
              name: true,
              slug: true,
              photoUrl: true,
              nationality: true,
              currentTeam: { select: { id: true, name: true } },
              team: { select: { id: true, name: true } },
            },
            take: 100,
          })
          .catch(swallow('catalog.coaches', [])),
      ]);

      const teams: CatalogTeam[] = rawTeams.map((t) => ({
        id: t.id,
        name: t.name,
        officialName: t.officialName,
        slug: t.slug,
        logoUrl: t.logoUrl,
        externalId: t.externalId,
        country: t.standings[0]?.league.country || null,
        leagueName: t.standings[0]?.league.name || null,
      }));

      const players: CatalogPlayer[] = rawPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        officialName: p.officialName,
        slug: p.slug,
        photoUrl: p.photoUrl,
        position: p.position,
        nationality: p.nationality,
        teamName: p.teams[0]?.team.name || null,
        teamId: p.teams[0]?.team.id || null,
      }));

      const coaches: CatalogCoach[] = rawCoaches.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.id,
        photoUrl: c.photoUrl,
        nationality: c.nationality,
        teamName: c.currentTeam?.name || c.team?.name || null,
        teamId: c.currentTeam?.id || c.team?.id || null,
      }));

      const result: QuickCatalog = {
        teams,
        players,
        leagues,
        coaches,
        loadedAt: Date.now(),
      };
      catalogCache = result;
      return result;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export interface SuggestionHit {
  label: string;
  typeKey: 'team' | 'player' | 'league' | 'news';
  url: string;
  photoUrl?: string | null;
}

export async function quickSearchSuggestions(
  query: string,
  locale: string
): Promise<SuggestionHit[]> {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const catalog = await getQuickCatalog();
  const slug = q.replace(/\s+/g, '-');
  const results: SuggestionHit[] = [];

  // 1. Search Teams (Lightning fast in-memory)
  const matchingTeams = catalog.teams
    .filter((t) => {
      const name = t.name.toLowerCase();
      const localized = localizeTeamName(locale, t.name).toLowerCase();
      return name.includes(q) || localized.includes(q) || t.slug.includes(slug);
    })
    .slice(0, 4);

  for (const t of matchingTeams) {
    results.push({
      label: localizeTeamName(locale, t.name),
      typeKey: 'team',
      url: `/team/${t.slug}`,
      photoUrl: t.logoUrl,
    });
  }

  // 2. Search Players (Lightning fast in-memory)
  const matchingPlayers = catalog.players
    .filter((p) => {
      const name = p.name.toLowerCase();
      const localized = localizePlainName(locale, p.name).toLowerCase();
      return name.includes(q) || localized.includes(q) || p.slug.includes(slug);
    })
    .slice(0, 3);

  for (const p of matchingPlayers) {
    results.push({
      label: localizePlainName(locale, p.name),
      typeKey: 'player',
      url: `/player/${p.slug}`,
      photoUrl: p.photoUrl,
    });
  }

  // 3. Search Leagues (Lightning fast in-memory)
  const matchingLeagues = catalog.leagues
    .filter((lg) => {
      const name = lg.name.toLowerCase();
      const localized = localizePlainName(locale, lg.name).toLowerCase();
      return name.includes(q) || localized.includes(q) || lg.slug.includes(slug);
    })
    .slice(0, 2);

  for (const lg of matchingLeagues) {
    results.push({
      label: localizePlainName(locale, lg.name),
      typeKey: 'league',
      url: `/league/${lg.slug}`,
      photoUrl: lg.logoUrl,
    });
  }

  return results;
}
