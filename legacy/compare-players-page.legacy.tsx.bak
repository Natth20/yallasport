import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { PlayerComparePicker } from '@/components/players/PlayerComparePicker';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { BrandMark } from '@/components/brand/BrandMark';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { PlayerCompareBoard } from '@/components/players/PlayerCompareBoard';
import { listCompareFaces, loadPlayerCompareCard, type PlayerCompareCard } from '@/lib/players/load-dossier';



export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const fallback = pageMetadata({
    locale,
    title: pick(locale, 'مقارنة اللاعبين', 'Player comparison'),
    description: pick(
      locale,
      'مقارنة لاعبين بأرقام الموسم من المصدر: ظهور، أهداف، صناعات، وبطاقات.',
      'Compare two players with this season’s source stats: appearances, goals, assists, and cards.',
    ),
    path: '/compare-players',
  });
  try {
    const { p1, p2 } = await searchParams;
    const [a, b] = await Promise.all([
      p1 ? prisma.player.findUnique({ where: { slug: p1 }, select: { name: true } }) : null,
      p2 ? prisma.player.findUnique({ where: { slug: p2 }, select: { name: true } }) : null,
    ]);
    const [left, right] = [p1, p2].filter(Boolean).sort();
    const title =
      a && b
        ? `${localizePlainName(locale, a.name)} × ${localizePlainName(locale, b.name)}`
        : pick(locale, 'مقارنة اللاعبين', 'Player comparison');
    return pageMetadata({
      locale,
      title,
      description: fallback.description as string,
      path: left && right ? `/compare-players?p1=${left}&p2=${right}` : '/compare-players',
    });
  } catch {
    return fallback;
  }
}

function Portrait({
  card,
  locale,
  accent,
}: {
  card: PlayerCompareCard;
  locale: string;
  accent: 'cyan' | 'amber';
}) {
  const name = localizePlainName(locale, card.name);
  const team = card.club ? localizePlainName(locale, card.club.name) : null;
  const position = card.position ? localizePlainName(locale, card.position) : null;
  const nation = card.nationality ? localizePlainName(locale, card.nationality) : null;
  const ring = accent === 'cyan' ? 'border-cyan-500' : 'border-amber-500';
  const tint = accent === 'cyan' ? 'text-cyan-500' : 'text-amber-500';
  const meta = [position, nation, card.age ? pick(locale, `${card.age} سنة`, `${card.age} yrs`) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center">
      <div className={`mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 bg-muted ${ring}`}>
        {card.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl font-black text-muted-foreground">
            {name.charAt(0)}
          </span>
        )}
      </div>
      <Link href={`/player/${card.slug}`} className="text-xl font-black text-foreground hover:text-primary">
        {name}
      </Link>
      {team && card.club?.slug ? (
        <Link href={`/team/${card.club.slug}`} className={`mt-1 block text-sm font-bold ${tint}`}>
          {team}
        </Link>
      ) : team ? (
        <span className={`mt-1 block text-sm font-bold ${tint}`}>{team}</span>
      ) : null}
      {meta ? <span className="mt-1 block text-xs text-muted-foreground">{meta}</span> : null}
      {card.competitions[0] ? (
        <span className="mt-2 block text-[11px] text-muted-foreground">
          {localizePlainName(locale, card.competitions[0])}
          {card.season ? ` · ${card.season}/${card.season + 1}` : ''}
        </span>
      ) : null}
    </div>
  );
}

export default function PlayerComparisonPage(props: {
  searchParams: Promise<{ p1?: string; p2?: string; season?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <PlayerComparisonPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function PlayerComparisonPageBody({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; season?: string }>;
}) {
  const locale = await getLocale();
  const { p1: slug1, p2: slug2, season: seasonParam } = await searchParams;
  const current = currentFootballSeason();
  const seasonYear = Number.parseInt(seasonParam || '', 10);
  const season = Number.isFinite(seasonYear) ? seasonYear : current;
  const same = Boolean(slug1 && slug2 && slug1 === slug2);
  const facesRaw = await listCompareFaces();
  const faces = facesRaw.map((face) => ({
    name: localizePlainName(locale, face.name),
    slug: face.slug,
    photoUrl: face.photoUrl,
  }));

  const [solo1, solo2] = await Promise.all([
    slug1 && (!slug2 || same)
      ? prisma.player.findUnique({ where: { slug: slug1 }, select: { name: true, slug: true } })
      : Promise.resolve(null),
    slug2 && !slug1
      ? prisma.player.findUnique({ where: { slug: slug2 }, select: { name: true, slug: true } })
      : Promise.resolve(null),
  ]);

  if (!slug1 || !slug2 || same) {
    return (
      <div className="versus-house relative min-h-screen overflow-hidden pb-16">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-full max-w-5xl -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-cyan-500/10 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-16">
          <header className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <BrandMark size={28} />
              <span className="font-mono text-xs text-muted-foreground">YS · PLAYERS</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              {pick(locale, 'مقارنة اللاعبين', 'Compare players')}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              {pick(
                locale,
                'ابحث عن أي لاعب من المصدر. الأرقام من إحصائيات الموسم، مو أصفار مخترعة.',
                'Pick two players. Figures are this season’s source stats — not invented zeros.',
              )}
            </p>
          </header>
          {same ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-700 dark:text-amber-300">
              {pick(locale, 'اختَر لاعبين مختلفين.', 'Pick two different players.')}
            </p>
          ) : null}
          <PlayerComparePicker
            locale={locale}
            initialP1={
              solo1
                ? { name: localizePlainName(locale, solo1.name), slug: solo1.slug, photoUrl: null }
                : null
            }
            initialP2={
              solo2
                ? { name: localizePlainName(locale, solo2.name), slug: solo2.slug, photoUrl: null }
                : null
            }
            faces={faces}
          />
        </div>
      </div>
    );
  }

  const [left, right] = await Promise.all([
    loadPlayerCompareCard(slug1, season),
    loadPlayerCompareCard(slug2, season),
  ]);
  if (!left || !right) notFound();

  const gk =
    /goalkeeper|حارس/i.test(left.position || '') || /goalkeeper|حارس/i.test(right.position || '');
  const seasonNote = left.season || right.season || season;
  const picked1 = { name: localizePlainName(locale, left.name), slug: left.slug, photoUrl: left.photoUrl };
  const picked2 = { name: localizePlainName(locale, right.name), slug: right.slug, photoUrl: right.photoUrl };
  const seasons = [current, current - 1, current - 2];

  return (
    <div className="versus-house relative min-h-screen overflow-hidden pb-16">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-full max-w-5xl -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-cyan-500/10 to-transparent blur-3xl" />
      <div className="relative mx-auto max-w-6xl space-y-10 px-4 py-12">
        <header className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <BrandMark size={28} />
            <span className="font-mono text-xs text-muted-foreground">YS · PLAYERS</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {picked1.name} × {picked2.name}
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            {pick(
              locale,
              `موسم ${seasonNote}/${seasonNote + 1} من المصدر. الشَرطة تعني أن الرقم ما وصل، مش صفر.`,
              `${seasonNote}/${seasonNote + 1} season from the source. A dash means the figure did not arrive — not a fake zero.`,
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {seasons.map((year) => (
              <Link
                key={year}
                href={`/compare-players?p1=${encodeURIComponent(slug1)}&p2=${encodeURIComponent(slug2)}&season=${year}`}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${year === season ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
              >
                {year}/{year + 1}
              </Link>
            ))}
          </div>
        </header>

        <PlayerComparePicker locale={locale} initialP1={picked1} initialP2={picked2} faces={faces} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
          <Portrait card={left} locale={locale} accent="cyan" />
          <PlayerCompareBoard locale={locale} left={left} right={right} gk={gk} p1={slug1} p2={slug2} />
          <Portrait card={right} locale={locale} accent="amber" />
        </div>
      </div>
    </div>
  );
}
