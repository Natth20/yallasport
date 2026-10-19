import { reportCaughtError } from '@/lib/ops/caught';
import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/security/http';
import { quickSearchSuggestions, getQuickCatalog } from '@/lib/search/quick-catalog';
import { localizePlainName, localizeTeamName, sourceSearchQuery } from '@/lib/i18n/sports-lexicon';
import { searchPlayers } from '@/lib/players/search';
import { prisma } from '@/lib/prisma';

// Ultra-fast in-memory sliding rate limiter (0.001ms check instead of 1.8s external Redis latency)
const localLimiter = new Map<string, { count: number; resetAt: number }>();

function isAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = localLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    localLimiter.set(ip, { count: 1, resetAt: now + 10_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 60; // Up to 60 requests per 10s per IP (plenty for typing)
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (!isAllowed(ip)) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().slice(0, 80);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const playerOnly = searchParams.get('kind') === 'player';
  const teamOnly = searchParams.get('kind') === 'team';

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const qLower = q.toLowerCase();
    const latin = sourceSearchQuery(q);
    const latinLower = latin.toLowerCase();
    const catalog = await getQuickCatalog();

    if (playerOnly) {
      const slug = qLower.replace(/\s+/g, '-');
      const latinSlug = latinLower.replace(/\s+/g, '-');
      const seen = new Set<string>();
      const players = catalog.players
        .filter((p) => {
          const name = p.name.toLowerCase();
          const localized = localizePlainName(locale, p.name).toLowerCase();
          const match =
            name.includes(qLower) ||
            localized.includes(qLower) ||
            p.slug.includes(slug) ||
            (latinLower && (name.includes(latinLower) || p.slug.includes(latinSlug)));
          if (!match || seen.has(p.slug)) return false;
          seen.add(p.slug);
          return true;
        })
        .slice(0, 10);

      // If in-memory catalog had no matches, fallback to ledger/live search so search never errors
      if (players.length === 0) {
        const fallbackHits = await searchPlayers(q, locale);
        return NextResponse.json({
          suggestions: fallbackHits.map((row) => ({
            label: row.name,
            typeKey: 'player' as const,
            slug: row.slug,
            url: `/player/${row.slug}`,
            photoUrl: row.photoUrl,
            teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
          })),
        });
      }

      return NextResponse.json({
        suggestions: players.map((row) => ({
          label: localizePlainName(locale, row.name),
          typeKey: 'player' as const,
          slug: row.slug,
          url: `/player/${row.slug}`,
          photoUrl: row.photoUrl,
          teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
        })),
      });
    }

    if (teamOnly) {
      const slug = qLower.replace(/\s+/g, '-');
      const latinSlug = latinLower.replace(/\s+/g, '-');
      const seen = new Set<string>();
      const teams = catalog.teams
        .filter((t) => {
          const name = t.name.toLowerCase();
          const localized = localizeTeamName(locale, t.name).toLowerCase();
          const match =
            name.includes(qLower) ||
            localized.includes(qLower) ||
            t.slug.includes(slug) ||
            (latinLower && (name.includes(latinLower) || t.slug.includes(latinSlug)));
          if (!match || seen.has(t.slug)) return false;
          seen.add(t.slug);
          return true;
        })
        .slice(0, 12);

      // If in-memory catalog had no matches, fallback to database search so nothing is missed
      if (teams.length === 0) {
        const dbTeams = await prisma.team.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { officialName: { contains: q, mode: 'insensitive' } },
              { slug: { contains: slug, mode: 'insensitive' } },
              ...(latin ? [{ name: { contains: latin, mode: 'insensitive' as const } }] : []),
            ],
          },
          take: 10,
          select: { id: true, name: true, slug: true, logoUrl: true },
        });

        return NextResponse.json({
          suggestions: dbTeams.map((row) => ({
            label: localizeTeamName(locale, row.name),
            typeKey: 'team' as const,
            slug: row.slug,
            url: `/team/${row.slug}`,
            photoUrl: row.logoUrl,
            country: null,
            leagueName: null,
          })),
        });
      }

      return NextResponse.json({
        suggestions: teams.map((row) => ({
          label: localizeTeamName(locale, row.name),
          typeKey: 'team' as const,
          slug: row.slug,
          url: `/team/${row.slug}`,
          photoUrl: row.logoUrl,
          country: row.country,
          leagueName: row.leagueName ? localizePlainName(locale, row.leagueName) : null,
        })),
      });
    }

    // Default: Unified quick suggestions across teams, players, leagues
    const suggestions = await quickSearchSuggestions(q, locale);
    return NextResponse.json({ suggestions });
  } catch (error) {
    reportCaughtError('src/app/api/search/suggestions/route.ts', error);
    return NextResponse.json({ suggestions: [] });
  }
}
