import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { SalonStage } from '@/components/salon/SalonStage';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import styles from '@/components/favorites/favorites-vault.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'المفضلة والمتابعات', 'My Favorites'),
    description: pick(
      locale,
      'فرقك ودورياتك ومبارياتك المحفوظة في حسابك الشخصي على يلا سبورت.',
      'Your saved teams, leagues, and matches in your personalized Yalla Sport dashboard.'
    ),
    path: '/favorites',
    noIndex: true,
  });
}

export default function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <FavoritesPageBody searchParams={searchParams} />
    </Suspense>
  );
}

type Tab = 'all' | 'TEAM' | 'LEAGUE' | 'MATCH';

function parseTab(raw?: string): Tab {
  if (raw === 'TEAM' || raw === 'LEAGUE' || raw === 'MATCH') return raw;
  return 'all';
}

async function FavoritesPageBody({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/favorites');
  }

  const tab = parseTab((await searchParams).tab);

  const favorites = await prisma.userFavorite.findMany({
    where: { userId: session.user.id },
    orderBy: { id: 'desc' },
  });

  const teamIds = favorites.filter((row) => row.entityType === 'TEAM').map((row) => row.entityId);
  const leagueIds = favorites.filter((row) => row.entityType === 'LEAGUE').map((row) => row.entityId);
  const matchIds = favorites.filter((row) => row.entityType === 'MATCH').map((row) => row.entityId);

  const [teams, leagues, matches] = await Promise.all([
    teamIds.length
      ? prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true, slug: true, logoUrl: true },
      })
      : [],
    leagueIds.length
      ? prisma.league.findMany({
        where: { id: { in: leagueIds } },
        select: { id: true, name: true, slug: true, logoUrl: true, country: true },
      })
      : [],
    matchIds.length
      ? prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          kickoffAt: true,
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
          league: { select: { name: true } },
        },
      })
      : [],
  ]);

  const cards = [
    ...teams.map((row) => ({
      id: row.id,
      kind: 'TEAM' as const,
      href: `/team/${row.slug}`,
      label: pick(locale, 'فريق', 'Team'),
      name: localizePlainName(locale, row.name),
      logoUrl: row.logoUrl,
      secondaryLogo: null as string | null,
      detail: pick(locale, 'نادي رياضي', 'Football Club'),
      score: null as string | null,
      isLive: false,
    })),
    ...leagues.map((row) => ({
      id: row.id,
      kind: 'LEAGUE' as const,
      href: `/league/${row.slug}`,
      label: pick(locale, 'بطولة', 'League'),
      name: localizePlainName(locale, row.name),
      logoUrl: row.logoUrl,
      secondaryLogo: null as string | null,
      detail: row.country ? localizePlainName(locale, row.country) : pick(locale, 'دوري معتمد', 'Official League'),
      score: null as string | null,
      isLive: false,
    })),
    ...matches.map((row) => {
      const scored = row.homeScore != null && row.awayScore != null;
      return {
        id: row.id,
        kind: 'MATCH' as const,
        href: `/match/${row.id}`,
        label: pick(locale, 'مباراة', 'Match'),
        name: `${localizePlainName(locale, row.homeTeam.name)} × ${localizePlainName(locale, row.awayTeam.name)}`,
        logoUrl: row.homeTeam.logoUrl,
        secondaryLogo: row.awayTeam.logoUrl,
        detail: localizePlainName(locale, row.league.name),
        score: scored ? `${row.homeScore} – ${row.awayScore}` : null,
        isLive: row.status === 'LIVE',
      };
    }),
  ];

  const visible = tab === 'all' ? cards : cards.filter((card) => card.kind === tab);
  const tabs: Array<{ id: Tab; label: string; n: number }> = [
    { id: 'all', label: pick(locale, 'الكل', 'All'), n: cards.length },
    { id: 'TEAM', label: pick(locale, 'الفرق', 'Teams'), n: teams.length },
    { id: 'LEAGUE', label: pick(locale, 'البطولات', 'Leagues'), n: leagues.length },
    { id: 'MATCH', label: pick(locale, 'المباريات', 'Matches'), n: matches.length },
  ];
  const who = session.user.name || session.user.email || '';

  return (
    <SalonStage
      tone="keep"
      wide
      compact
      kicker={pick(locale, 'حسابك', 'Your account')}
      title={pick(locale, 'المفضلة', 'Favorites')}
      lead={pick(
        locale,
        'الفرق والبطولات والمباريات التي حفظتها من المكتب. القلب على البطاقة هو اللي يضيفها هنا.',
        'Teams, leagues, and matches you saved from the desk. The heart on a card is what files them here.',
      )}
      aside={who ? `${cards.length} · ${who}` : String(cards.length)}
      tools={
        <nav className="salon-tabs" aria-label={pick(locale, 'تصنيف المفضلة', 'Favorite kinds')}>
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.id === 'all' ? '/favorites' : `/favorites?tab=${item.id}`}
              className={`salon-tab${tab === item.id ? ' is-on' : ''}`}
            >
              {item.label}
              <span> {item.n}</span>
            </Link>
          ))}
        </nav>
      }
    >
      {visible.length === 0 ? (
        <div className="salon-empty">
          <strong>{pick(locale, 'ما في عناصر في هذا التصنيف', 'Nothing in this shelf')}</strong>
          <p>
            {pick(
              locale,
              'افتح المباريات أو البطولات واضغط القلب. ما بنعرض متابعة مخترعة.',
              'Open matches or leagues and tap the heart. We do not invent follows.',
            )}
          </p>
          <div className={styles.doors}>
            <Link href="/matches" className={styles.door}>
              {pick(locale, 'جدول المباريات', 'Matchday')}
            </Link>
            <Link href="/leagues" className={styles.doorAlt}>
              {pick(locale, 'البطولات', 'Leagues')}
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((card) => (
            <Link key={`${card.kind}-${card.id}`} href={card.href} className={styles.card}>
              <span className={`${styles.crests}${card.secondaryLogo ? ` ${styles.pair}` : ''}`}>
                <LeagueCrest name={card.name} logoUrl={card.logoUrl} className={styles.crest} />
                {card.secondaryLogo ? (
                  <LeagueCrest name={card.name} logoUrl={card.secondaryLogo} className={styles.crest} />
                ) : null}
              </span>
              <span>
                <span className={styles.kind}>
                  {card.label}
                  {card.isLive ? (
                    <span className={styles.live}>
                      <i />
                      {pick(locale, 'مباشر', 'Live')}
                    </span>
                  ) : null}
                </span>
                <strong className={styles.name}>{card.name}</strong>
                {card.detail ? <span className={styles.detail}>{card.detail}</span> : null}
              </span>
              {card.score ? <span className={styles.score}>{card.score}</span> : <span />}
            </Link>
          ))}
        </div>
      )}
    </SalonStage>
  );
}
