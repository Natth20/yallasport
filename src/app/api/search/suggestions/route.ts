import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { ratelimit } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(`search_sugg_${ip}`);
  if (!success) return NextResponse.json({ suggestions: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().slice(0, 80);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const contains = { contains: q, mode: 'insensitive' as const };

  try {
    const [teams, players, leagues, newsRows] = await Promise.all([
      prisma.team.findMany({ where: { name: contains }, take: 3, select: { name: true, slug: true } }),
      prisma.player.findMany({ where: { name: contains }, take: 3, select: { name: true, slug: true } }),
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
      ...players.map((row) => ({ label: row.name, typeKey: 'player' as const, url: `/player/${row.slug}` })),
      ...leagues.map((row) => ({ label: row.name, typeKey: 'league' as const, url: `/league/${row.slug}` })),
      ...news.map((row) => ({ label: row.title, typeKey: 'news' as const, url: `/news/${row.slug}` })),
    ];

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
