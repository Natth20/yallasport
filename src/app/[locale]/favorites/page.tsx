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
import { SalonStage } from '@/components/salon/SalonStage';
import { Stagger, StaggerItem, HeroEnter } from '@/components/motion/PageMotion';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import {
  Heart,
  Shield,
  Trophy,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
} from 'lucide-react';

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
  const isAr = locale === 'ar';
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
        score: scored ? `${row.homeScore} – ${row.awayScore}` : row.status === 'LIVE' ? 'LIVE' : null as string | null,
        isLive: row.status === 'LIVE',
      };
    }),
  ];

  const visible = tab === 'all' ? cards : cards.filter((card) => card.kind === tab);
  const tabs: Array<{ id: Tab; label: string; n: number; icon: any }> = [
    { id: 'all', label: pick(locale, 'الكل', 'All'), n: cards.length, icon: Sparkles },
    { id: 'TEAM', label: pick(locale, 'الفرق المحفوظة', 'Saved Teams'), n: teams.length, icon: Shield },
    { id: 'LEAGUE', label: pick(locale, 'البطولات', 'Leagues'), n: leagues.length, icon: Trophy },
    { id: 'MATCH', label: pick(locale, 'المباريات', 'Matches'), n: matches.length, icon: Calendar },
  ];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-8">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/15 via-emerald-500/10 to-transparent blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ——— Hero Header ——— */}
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <HeroEnter className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-primary" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {pick(locale, 'خزنتك الرياضية الخاصة', 'Personal Stadium Vault')}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {session.user.name || session.user.email}
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
                {cards.length} {pick(locale, 'عنصر محفوظ', 'Saved Items')}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                {pick(locale, 'المفضلة والمتابعات', 'My Saved Favorites')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                {pick(
                  locale,
                  'جميع الأندية، البطولات، ومباريات اليوم التي قمت بمتابعتها مجمعة في مكان واحد لتصل لنتائجها وتوقيتاتها بلمحة سريعة.',
                  'All your followed teams, leagues, and bookmarked matches organized in one high-performance dashboard.'
                )}
              </p>
            </div>

            {/* Category Switcher Tabs */}
            <nav className="flex flex-wrap gap-2 pt-2" aria-label={pick(locale, 'تصنيف المفضلة', 'Favorite kinds')}>
              {tabs.map((item) => {
                const active = tab === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.id === 'all' ? '/favorites' : `/favorites?tab=${item.id}`}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    <span className={`font-mono text-[11px] rounded px-1.5 py-0.2 ${active ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {item.n}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </HeroEnter>
        </header>

        {/* ——— Content Grid or Empty State ——— */}
        {visible.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card/40 p-12 text-center backdrop-blur-xl shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">
              {pick(locale, 'خزنة المفضلة لا تزال بانتظارك', 'Your Vault is Currently Empty')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
              {pick(
                locale,
                'تصفح المباريات أو صفحة الفرق والبطولات واضغط على زر المتابعة (❤️) لتظهر هنا تلقائياً.',
                'Browse today matches, teams, or leagues and tap the follow icon (❤️) to bookmark them here.'
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                <Calendar className="w-4 h-4" />
                <span>{pick(locale, 'جدول مباريات اليوم', 'Today Matches')}</span>
              </Link>
              <Link
                href="/leagues"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-muted"
              >
                <Trophy className="w-4 h-4" />
                <span>{pick(locale, 'استكشف البطولات', 'Explore Leagues')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((card) => (
              <StaggerItem key={`${card.kind}-${card.id}`}>
                <Link
                  href={card.href}
                  className="group rounded-2xl border border-border bg-card/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/90 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex-shrink-0">
                      {card.secondaryLogo ? (
                        <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                          <LeagueCrest name={card.name} logoUrl={card.logoUrl} className="h-8 w-8 object-contain" />
                          <LeagueCrest name={card.name} logoUrl={card.secondaryLogo} className="h-8 w-8 object-contain" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-secondary/60 flex items-center justify-center p-1.5 border border-border group-hover:border-primary/40 transition-colors">
                          <LeagueCrest name={card.name} logoUrl={card.logoUrl} className="h-8 w-8 object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {card.label}
                        </span>
                        {card.isLive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <b className="text-xs font-bold text-foreground block truncate group-hover:text-primary transition-colors">
                        {card.name}
                      </b>
                      {card.detail && (
                        <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                          {card.detail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {card.score && (
                      <span className="font-mono text-xs font-black text-foreground bg-secondary/80 px-2.5 py-1 rounded-lg border border-border">
                        {card.score}
                      </span>
                    )}
                    <ArrowIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
