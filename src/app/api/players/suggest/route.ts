import { reportCaughtError } from '@/lib/ops/caught';
import { searchPlayers } from '@/lib/players/search';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().slice(0, 80);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'ar';
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const players = await searchPlayers(q, locale);
    return NextResponse.json({
      suggestions: players.map((row) => ({
        label: row.name,
        slug: row.slug,
        url: `/player/${row.slug}`,
        photoUrl: row.photoUrl,
        teamName: row.teamName,
      })),
    });
  } catch (error) {
    reportCaughtError('src/app/api/players/suggest/route.ts', error);
    return NextResponse.json({ suggestions: [] });
  }
}
