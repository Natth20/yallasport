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
import { currentFootballSeason } from '@/lib/sports-data/season';
import { PlayerCompareBoard } from '@/components/players/PlayerCompareBoard';
import { listCompareFaces, loadPlayerCompareCard, type PlayerCompareCard } from '@/lib/players/load-dossier';
import { SalonStage } from '@/components/salon/SalonStage';
import folio from '@/components/players/compare-folio.module.css';



export const revalidate = 120;

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
  const meta = [position, nation, card.age ? pick(locale, `${card.age} سنة`, `${card.age} yrs`) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={folio.portrait} data-accent={accent}>
      <div className={folio.face}>
        {card.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.photoUrl} alt="" />
        ) : (
          <span>{name.charAt(0)}</span>
        )}
      </div>
      <Link href={`/player/${card.slug}`} className={folio.name}>
        {name}
      </Link>
      {team && card.club?.slug ? (
        <Link href={`/team/${card.club.slug}`} className={folio.team}>
          {team}
        </Link>
      ) : team ? (
        <span className={folio.team}>{team}</span>
      ) : null}
      {meta ? <span className={folio.meta}>{meta}</span> : null}
      {card.competitions[0] ? (
        <span className={folio.comp}>
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
  const pinned = Number.isFinite(seasonYear);
  const season = pinned ? seasonYear : current;
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
      <SalonStage
        tone="booth"
        wide
        kicker={pick(locale, 'مكتب المقارنة', 'Compare desk')}
        title={pick(locale, 'مقارنة اللاعبين', 'Compare players')}
        lead={pick(
          locale,
          'ابحث عن أي لاعب من المصدر. الأرقام من إحصائيات الموسم، مو أصفار مخترعة.',
          'Pick two players. Figures are this season’s source stats — not invented zeros.',
        )}
      >
        {same ? (
          <p className={folio.warn}>{pick(locale, 'اختَر لاعبين مختلفين.', 'Pick two different players.')}</p>
        ) : (
          <p className={folio.hint}>
            {pick(
              locale,
              'اكتب حرفين من الاسم. النتائج تطلع من الدفتر أولاً، وبعدين من المصدر إن لزم.',
              'Type two letters. The desk answers first; the source is asked only if the ledger is thin.',
            )}
          </p>
        )}
        <PlayerComparePicker
          locale={locale}
          season={season}
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
        {faces.length >= 2 ? (
          <div className={folio.suggest}>
            <p>{pick(locale, 'وجوه من الدفتر', 'Faces on the desk')}</p>
            <div className={folio.suggestGrid}>
              {Array.from({ length: Math.min(3, Math.floor(faces.length / 2)) }, (_, index) => {
                const face = faces[index * 2];
                const other = faces[index * 2 + 1];
                if (!face || !other) return null;
                return (
                  <Link
                    key={`${face.slug}-${other.slug}`}
                    href={`/compare-players?p1=${encodeURIComponent(face.slug)}&p2=${encodeURIComponent(other.slug)}`}
                    className={folio.suggestCard}
                  >
                    {face.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={face.photoUrl} alt="" />
                    ) : (
                      <i>{face.name.charAt(0)}</i>
                    )}
                    <span>
                      <strong>{face.name}</strong>
                      <em>{other.name}</em>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </SalonStage>
    );
  }

  const [left, right] = await Promise.all([
    loadPlayerCompareCard(slug1, pinned ? season : undefined),
    loadPlayerCompareCard(slug2, pinned ? season : undefined),
  ]);
  if (!left || !right) notFound();

  const gk =
    /goalkeeper|حارس/i.test(left.position || '') || /goalkeeper|حارس/i.test(right.position || '');
  const seasonNote = left.season || right.season || season;
  const shownSeason = left.season || right.season || season;
  const picked1 = { name: localizePlainName(locale, left.name), slug: left.slug, photoUrl: left.photoUrl };
  const picked2 = { name: localizePlainName(locale, right.name), slug: right.slug, photoUrl: right.photoUrl };
  const seasons = [current, current - 1, current - 2];

  return (
    <SalonStage
      tone="booth"
      wide
      kicker={pick(locale, 'مكتب المقارنة', 'Compare desk')}
      title={`${picked1.name} × ${picked2.name}`}
      lead={pick(
        locale,
        `موسم ${seasonNote}/${seasonNote + 1} من المصدر. الشَرطة تعني أن الرقم ما وصل، مش صفر.`,
        `${seasonNote}/${seasonNote + 1} season from the source. A dash means the figure did not arrive — not a fake zero.`,
      )}
      tools={
        <div className="salon-foyer">
          <nav className="salon-tabs" aria-label={pick(locale, 'الموسم', 'Season')}>
            {seasons.map((year) => (
              <Link
                key={year}
                href={`/compare-players?p1=${encodeURIComponent(slug1)}&p2=${encodeURIComponent(slug2)}&season=${year}`}
                className={`salon-tab${year === shownSeason ? ' is-on' : ''}`}
              >
                {year}/{year + 1}
              </Link>
            ))}
          </nav>
        </div>
      }
    >
      <PlayerComparePicker locale={locale} season={season} initialP1={picked1} initialP2={picked2} faces={faces} />

      <div className={folio.grid}>
        <div className={folio.pair}>
          <Portrait card={left} locale={locale} accent="cyan" />
          <Portrait card={right} locale={locale} accent="amber" />
        </div>
        <PlayerCompareBoard locale={locale} left={left} right={right} gk={gk} p1={slug1} p2={slug2} season={shownSeason} />
      </div>
    </SalonStage>
  );
}
