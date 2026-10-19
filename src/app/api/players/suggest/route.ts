import { reportCaughtError } from '@/lib/ops/caught';
import { searchPlayers } from '@/lib/players/search';
import { NextRequest, NextResponse } from 'next/server';
import { getQuickCatalog } from '@/lib/search/quick-catalog';
import { localizePlainName, localizeTeamName, sourceSearchQuery } from '@/lib/i18n/sports-lexicon';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().slice(0, 80);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const qLower = q.toLowerCase();
    const slug = qLower.replace(/\s+/g, '-');
    const latin = sourceSearchQuery(q);
    const latinLower = latin.toLowerCase();
    const latinSlug = latinLower.replace(/\s+/g, '-');
    const catalog = await getQuickCatalog();

    const seen = new Set<string>();
    const inMemoryHits = catalog.players
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

    if (inMemoryHits.length > 0) {
      return NextResponse.json({
        suggestions: inMemoryHits.map((row) => ({
          label: localizePlainName(locale, row.name),
          slug: row.slug,
          url: `/player/${row.slug}`,
          photoUrl: row.photoUrl,
          teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
        })),
      });
    }

    const players = await searchPlayers(q, locale);
    return NextResponse.json({
      suggestions: players.map((row) => ({
        label: row.name,
        slug: row.slug,
        url: `/player/${row.slug}`,
        photoUrl: row.photoUrl,
        teamName: row.teamName ? localizeTeamName(locale, row.teamName) : null,
      })),
    });
  } catch (error) {
    reportCaughtError('src/app/api/players/suggest/route.ts', error);
    return NextResponse.json({ suggestions: [] });
  }
}
