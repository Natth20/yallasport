import { reportCaughtError } from '@/lib/ops/caught';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { searchPlayers } from '@/lib/players/search';
import { searchRatelimit } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/lib/security/http';

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const { success } = await searchRatelimit.limit(`search_sugg_${ip}`);
  if (!success) return NextResponse.json({ suggestions: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().slice(0, 80);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  const playerOnly = searchParams.get('kind') === 'player';
  const teamOnly = searchParams.get('kind') === 'team';

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    if (playerOnly) {
      const players = await searchPlayers(q, locale);
      return NextResponse.json({
        suggestions: players.map((row) => ({
          label: row.name,
          typeKey: 'player' as const,
          slug: row.slug,
          url: `/player/${row.slug}`,
          photoUrl: row.photoUrl,
          teamName: row.teamName,
        })),
      });
    }

    if (teamOnly) {
      const teams = await prisma.team.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 12,
        select: { name: true, slug: true, logoUrl: true, externalId: true },
      });
      return NextResponse.json({
        suggestions: teams.map((row) => ({
          label: localizePlainName(locale, row.name),
          typeKey: 'team' as const,
          slug: row.slug,
          url: `/team/${row.slug}`,
          photoUrl: row.logoUrl,
          externalId: row.externalId,
        })),
      });
    }

    const contains = { contains: q, mode: 'insensitive' as const };
    const [teams, players, leagues, newsRows] = await Promise.all([
      prisma.team.findMany({ where: { name: contains }, take: 3, select: { name: true, slug: true } }),
      prisma.player.findMany({
        where: { OR: [{ name: contains }, { officialName: contains }] },
        take: 3,
        select: { name: true, slug: true },
      }),
      prisma.league.findMany({ where: { name: contains }, take: 2, select: { name: true, slug: true } }),
      prisma.news.findMany({
        where: {
          AND: [
            newsVisibleWhere(locale),
            {
              OR: [
                { title: contains },
                { translations: { some: { locale, status: 'APPROVED', title: contains } } },
              ],
            },
          ],
        },
        take: 3,
        select: { id: true, title: true, slug: true, sourceLocale: true },
      }),
    ]);

    const news = await overlayNewsList(newsRows, locale);

    const suggestions = [
      ...teams.map((row) => ({ label: row.name, typeKey: 'team' as const, url: `/team/${row.slug}` })),
      ...players.map((row) => ({
        label: localizePlainName(locale, row.name),
        typeKey: 'player' as const,
        url: `/player/${row.slug}`,
      })),
      ...leagues.map((row) => ({ label: row.name, typeKey: 'league' as const, url: `/league/${row.slug}` })),
      ...news.map((row) => ({ label: row.title, typeKey: 'news' as const, url: `/news/${row.slug}` })),
    ];

    return NextResponse.json({ suggestions });
  } catch (error) {
    reportCaughtError('src/app/api/search/suggestions/route.ts', error);
    return NextResponse.json({ suggestions: [] });
  }
}
