import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { loadTransferDesk } from '@/lib/transfers/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { localizeTransferType } from '@/lib/transfers/fee';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { TransferFace } from '@/components/transfers/TransferFace';
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Coins,
  DollarSign,
  Flame,
  Radio,
  Repeat,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { TransferFilters } from '@/components/transfers/TransferFilters';
import { ClientTime } from '@/components/datetime/ClientTime';
import styles from '@/components/transfers/transfers.module.css';

export const revalidate = 90;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الانتقالات وأخبار الميركاتو اليوم', 'Transfers and mercato moves today'),
    description: pick(
      locale,
      'انتقالات مؤكدة من المصدر: القادمون والمغادرون والإعارات والقيمة عند توفرها، بلا اختراع.',
      'Confirmed source moves: incoming, outgoing, loans, and fees when known — nothing invented.',
    ),
    path: '/transfers',
  });
}

function monthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ar-EG', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function groupByMonth<T extends { date: Date }>(rows: T[]) {
  const groups: Array<{ key: string; label: Date; rows: T[] }> = [];
  const index = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 7);
    const at = index.get(key);
    if (at == null) {
      index.set(key, groups.length);
      groups.push({ key, label: row.date, rows: [row] });
    } else {
      groups[at].rows.push(row);
    }
  }
  return groups;
}

export default function TransfersPage(props: {
  searchParams: Promise<{ club?: string; player?: string; season?: string; kind?: string; window?: string; direction?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <TransfersPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TransfersPageBody({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; player?: string; season?: string; kind?: string; window?: string; direction?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const club = params.club?.trim() || '';
  const player = params.player?.trim() || '';
  const season = params.season?.trim() || '';
  const kind = params.kind?.trim() || '';
  const window = params.window?.trim() || '';
  const direction = params.direction?.trim() || '';
  const desk = await loadTransferDesk({ club, player, season, kind, window, direction });
  const groups = groupByMonth(desk.rows);
  const paid = desk.rows.filter((row) => row.fee).length;
  const loans = desk.rows.filter((row) => row.kind === 'loan').length;
  const frees = desk.rows.filter((row) => row.kind === 'free').length;
  const ar = locale === 'ar';

  const transferNewsRaw = await prisma.news.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { category: { in: ['Transfers', 'Premier League', 'Champions League', 'Football'] } },
        { title: { contains: 'انتقال' } },
        { title: { contains: 'صفقة' } },
        { title: { contains: 'ميركاتو' } },
        { title: { contains: 'ضم' } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      featuredImage: true,
      sourceName: true,
      category: true,
      entityLinks: {
        select: {
          entityType: true,
          entityId: true,
        },
      },
    },
  });

  const allTeamIds = [
    ...new Set(
      transferNewsRaw.flatMap((n) =>
        n.entityLinks.filter((e) => e.entityType === 'TEAM').map((e) => e.entityId)
      )
    ),
  ];
  const allPlayerIds = [
    ...new Set(
      transferNewsRaw.flatMap((n) =>
        n.entityLinks.filter((e) => e.entityType === 'PLAYER').map((e) => e.entityId)
      )
    ),
  ];

  const linkedTeamsMap = new Map<string, { id: string; name: string; slug: string | null }>();
  if (allTeamIds.length > 0) {
    const teams = await prisma.team.findMany({
      where: { id: { in: allTeamIds } },
      select: { id: true, name: true, slug: true },
    });
    for (const t of teams) linkedTeamsMap.set(t.id, t);
  }

  const linkedPlayersMap = new Map<string, { id: string; name: string; slug: string | null }>();
  if (allPlayerIds.length > 0) {
    const players = await prisma.player.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, name: true, slug: true },
    });
    for (const p of players) linkedPlayersMap.set(p.id, p);
  }

  const transferNews = transferNewsRaw.map((n) => ({
    ...n,
    teams: n.entityLinks
      .filter((e) => e.entityType === 'TEAM')
      .map((e) => linkedTeamsMap.get(e.entityId))
      .filter((t): t is { id: string; name: string; slug: string | null } => Boolean(t && t.slug)),
    players: n.entityLinks
      .filter((e) => e.entityType === 'PLAYER')
      .map((e) => linkedPlayersMap.get(e.entityId))
      .filter((p): p is { id: string; name: string; slug: string | null } => Boolean(p && p.slug)),
  }));

  const tally = [
    { value: desk.rows.length, label: pick(locale, 'حركة موثقة', 'Verified Moves'), icon: Activity },
    ...(paid > 0 ? [{ value: paid, label: pick(locale, 'صفقة برسم مالي', 'Deals with Fee'), icon: Coins }] : []),
    ...(loans > 0 ? [{ value: loans, label: pick(locale, 'إعارة مؤكدة', 'Loan Deals'), icon: Repeat }] : []),
    ...(frees > 0 ? [{ value: frees, label: pick(locale, 'انتقال حر', 'Free Transfers'), icon: CheckCircle2 }] : []),
  ];

  return (
    <SalonStage
      tone="market"
      kicker={pick(locale, 'سلك الميركاتو الحصري', 'Mercato Wire')}
      title={pick(locale, 'سوق الانتقالات', 'Transfer Market')}
      lead={pick(
        locale,
        `موسم ${desk.fromSeason}/${desk.fromSeason + 1} وموسم ${desk.seasonLabel}/${desk.seasonLabel + 1} — توثيق فوري لصفقات الأندية بدون اختراع شائعات.`,
        `Seasons ${desk.fromSeason}/${desk.fromSeason + 1} and ${desk.seasonLabel}/${desk.seasonLabel + 1} from verified source ledgers.`,
      )}
      aside={pick(locale, `${desk.rows.length} صفقة موثقة`, `${desk.rows.length} verified deals`)}
      wide
      compact
      tools={
        <div className="salon-foyer">
          <HallFoyer
            label={pick(locale, 'جناح الملعب', 'Pitch suite')}
            items={[
              { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
              { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
              { href: '/transfers', label: pick(locale, 'الانتقالات', 'Transfers'), icon: ArrowLeftRight, current: true },
              { href: '/stats', label: pick(locale, 'إحصائيات', 'Stats'), icon: BarChart3 },
            ]}
          />
          <TransferFilters
            locale={locale}
            values={{ club, player, season, kind, window, direction }}
            clubs={[
              { value: '', label: pick(locale, 'كل الأندية', 'All clubs') },
              ...desk.clubs.map((name) => ({ value: name, label: localizePlainName(locale, name) })),
            ]}
            players={[
              { value: '', label: pick(locale, 'كل اللاعبين', 'All players') },
              ...desk.players.slice(0, 120).map((row) => ({
                value: row.slug || row.name,
                label: localizePlainName(locale, row.name),
              })),
            ]}
            seasons={[
              { value: '', label: pick(locale, 'آخر موسمين', 'Last two seasons') },
              ...desk.seasons.map((year) => ({ value: String(year), label: `${year}/${year + 1}` })),
            ]}
          />
        </div>
      }
    >
      <div className={styles.container}>
        {desk.syncedAt ? (
          <p className="xfer-fresh flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{pick(locale, 'آخر تحديث للدفتر', 'Last sync')}: <ClientTime value={desk.syncedAt} /></span>
            {desk.source ? <span className="opacity-60">({desk.source})</span> : null}
          </p>
        ) : null}

        {/* 1. SPOTLIGHT HERO RECORD DEAL */}
        {desk.headline ? (
          <article className={styles.heroCard}>
            <div className={styles.heroAvatarBox}>
              <TransferFace
                src={desk.headline.playerPhoto}
                name={localizePlainName(locale, desk.headline.playerName)}
                className={styles.heroAvatar}
                fallbackClassName={styles.heroAvatarInitial}
              />
            </div>
            <div className={styles.heroContent}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={styles.heroKicker}>
                  <Flame className="h-3 w-3" />
                  {pick(locale, 'أبرز الصفقات الموثقة', 'Top Verified Transfer')}
                </span>
                <span className={styles.verifiedBadge}>
                  <CheckCircle2 className="h-3 w-3" />
                  {pick(locale, 'صفقة مؤكدة رسمياً', 'Officially Confirmed')}
                </span>
              </div>
              <h2 className={styles.heroName}>
                {localizePlainName(locale, desk.headline.playerName)}
              </h2>
              <div className={styles.heroBridge}>
                <span className={styles.heroTeam}>
                  {desk.headline.fromLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={desk.headline.fromLogo} alt="" />
                  ) : null}
                  <span>{localizePlainName(locale, desk.headline.fromTeam || '—')}</span>
                </span>
                <span className={styles.heroArrow}>{ar ? '←' : '→'}</span>
                <span className={styles.heroTeam}>
                  {desk.headline.toLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={desk.headline.toLogo} alt="" />
                  ) : null}
                  <span>{localizePlainName(locale, desk.headline.toTeam || '—')}</span>
                </span>
              </div>
            </div>
            {desk.headline.fee ? (
              <div className={styles.heroFeeBox}>
                <span className={styles.heroFeeLabel}>{pick(locale, 'قيمة الصفقة', 'Transfer Fee')}</span>
                <span className={styles.heroFeeBadge}>
                  <DollarSign className="h-4 w-4" />
                  {desk.headline.fee}
                </span>
              </div>
            ) : null}
          </article>
        ) : null}

        {/* 2. TALLY HUD STATS */}
        {desk.rows.length > 0 ? (
          <div
            className={styles.tallyGrid}
            style={{
              gridTemplateColumns: `repeat(${Math.min(tally.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {tally.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={styles.tallyCard}>
                  <div className={styles.tallyIcon}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={styles.tallyInfo}>
                    <span className={styles.tallyValue}>{item.value}</span>
                    <span className={styles.tallyLabel}>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* 2.5. TRANSFER NEWS & MERCATO WIRE REPORTS (أخبار وتقارير الانتقالات والميركاتو) */}
        {transferNews.length > 0 ? (
          <section className={styles.transferNewsSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleBox}>
                <div className={styles.sectionIcon}>
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={styles.sectionTitle}>
                    {pick(locale, 'أخبار وتقارير الانتقالات والميركاتو', 'Mercato & Transfer News Reports')}
                  </h3>
                  <p className={styles.sectionDesc}>
                    {pick(
                      locale,
                      'تغطية صحفية لأنباء المفاوضات وتقارير الميركاتو مع روابط مباشرة لصفحات اللاعبين والأندية المذكورة',
                      'Press reports and rumors linked directly to relevant club and player profiles',
                    )}
                  </p>
                </div>
              </div>
              <span className={styles.rumorBadge}>
                <Radio className="h-3 w-3" />
                {pick(locale, 'تقارير وأنباء صحفية (غير مؤكدة)', 'Press Reports / Rumors')}
              </span>
            </div>

            <div className={styles.newsGrid}>
              {transferNews.map((article) => (
                <article key={article.id} className={styles.newsCard}>
                  <Link href={`/news/${article.slug}`} className={styles.newsImageWrap}>
                    {article.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.featuredImage} alt={article.title} className={styles.newsImage} />
                    ) : (
                      <div className={styles.newsImageFallback}>
                        <ArrowLeftRight className="h-8 w-8 text-orange-500/50" />
                      </div>
                    )}
                  </Link>

                  <div className={styles.newsBody}>
                    <div className={styles.newsMetaRow}>
                      <span className={styles.newsSource}>
                        {article.sourceName || pick(locale, 'يلا سبورت ميركاتو', 'Yalla Sport Mercato')}
                      </span>
                      {article.publishedAt ? (
                        <ClientTime
                          value={article.publishedAt}
                          options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                        />
                      ) : null}
                    </div>

                    <Link href={`/news/${article.slug}`}>
                      <h4 className={styles.newsTitle}>{article.title}</h4>
                    </Link>

                    {/* Entity Links: Players and Clubs */}
                    {article.players.length > 0 || article.teams.length > 0 ? (
                      <div className={styles.newsEntityLinks}>
                        {article.players.map((player) => (
                          <Link
                            key={`p-${player.id}`}
                            href={`/player/${player.slug}`}
                            className={styles.newsEntityChip}
                            title={pick(locale, 'ملف اللاعب', 'Player Profile')}
                          >
                            <span>👤</span>
                            <span>{localizePlainName(locale, player.name)}</span>
                          </Link>
                        ))}
                        {article.teams.map((team) => (
                          <Link
                            key={`t-${team.id}`}
                            href={`/team/${team.slug}`}
                            className={styles.newsEntityChip}
                            title={pick(locale, 'ملف النادي', 'Club Profile')}
                          >
                            <span>👥</span>
                            <span>{localizePlainName(locale, team.name)}</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* 3. LARGEST VERIFIED FEES (أعلى الصفقات قيمة) */}
        {desk.topFees.length > 1 ? (
          <section className={styles.showcaseSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleBox}>
                <div className={styles.sectionIcon}>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={styles.sectionTitle}>
                    {pick(locale, 'أعلى الصفقات قيمة ومبلغاً', 'Largest Verified Transfer Fees')}
                  </h3>
                  <p className={styles.sectionDesc}>
                    {pick(locale, 'أغلى الانتقالات الموثقة رسمياً في الميركاتو بالأرقام المعتمدة', 'Record verified fees in mercato ledgers')}
                  </p>
                </div>
              </div>
              <span className={styles.sectionPill}>Top {desk.topFees.slice(0, 5).length}</span>
            </div>

            <div className={styles.topFeesGrid}>
              {desk.topFees.slice(0, 5).map((row, index) => (
                <div key={`fee-${row.id}`} className={styles.feeCard}>
                  <div className={styles.feeCardHead}>
                    <span className={`${styles.rankBadge} ${styles[`rank${index + 1}`] || ''}`}>
                      #{index + 1}
                    </span>
                    <span className={styles.verifiedBadge}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {pick(locale, 'مؤكدة رسمياً', 'Confirmed')}
                    </span>
                    <span className={styles.feeAmount}>{row.fee}</span>
                  </div>

                  <div className={styles.feePlayerBox}>
                    <TransferFace
                      src={row.playerPhoto}
                      name={localizePlainName(locale, row.playerName)}
                      className={styles.feePlayerAvatar}
                      fallbackClassName={styles.feePlayerInitial}
                    />
                    <div className={styles.feePlayerInfo}>
                      {row.playerSlug ? (
                        <Link href={`/player/${row.playerSlug}`} className={styles.feePlayerName}>
                          {localizePlainName(locale, row.playerName)}
                        </Link>
                      ) : (
                        <span className={styles.feePlayerName}>{localizePlainName(locale, row.playerName)}</span>
                      )}
                      <span className={styles.feeDate}>
                        {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC',
                        }).format(row.date)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.feeRoute}>
                    <span className={styles.feeTeam}>
                      {row.fromLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.fromLogo} alt="" className={styles.feeTeamLogo} />
                      ) : null}
                      <span>{localizePlainName(locale, row.fromTeam || '—')}</span>
                    </span>
                    <span className={styles.feeArrow}>{ar ? '←' : '→'}</span>
                    <span className={styles.feeTeam}>
                      {row.toLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.toLogo} alt="" className={styles.feeTeamLogo} />
                      ) : null}
                      <span>{localizePlainName(locale, row.toTeam || '—')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* 4. BUSIEST CLUBS IN MERCATO (أكثر الأندية نشاطًا وحركة - FULL WIDTH ON DESKTOP & BEAUTIFUL ON MOBILE) */}
        {desk.busiest.length > 0 ? (
          <section className={styles.showcaseSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleBox}>
                <div className={styles.sectionIcon}>
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={styles.sectionTitle}>
                    {pick(locale, 'أكثر الأندية نشاطًا وحركة في الميركاتو', 'Most Active & Busiest Clubs')}
                  </h3>
                  <p className={styles.sectionDesc}>
                    {pick(
                      locale,
                      'إجمالي حركات الاستقدام والإعارة والبيع المسجلة لكل نادٍ في السوق',
                      'Breakdown of incoming, outgoing, and total transfers recorded per club',
                    )}
                  </p>
                </div>
              </div>
              <span className={styles.sectionPill}>
                {desk.busiest.length} {pick(locale, 'أندية نشطة', 'active clubs')}
              </span>
            </div>

            <div className={styles.busiestGrid}>
              {desk.busiest.map((club, index) => {
                const clubName = localizePlainName(locale, club.name);
                const totalMoves = club.in + club.out;
                const inPercent = totalMoves > 0 ? Math.round((club.in / totalMoves) * 100) : 50;

                const CardContent = (
                  <div className={styles.clubCard}>
                    {/* Header: Rank + Club Crest & Name */}
                    <div className={styles.clubHead}>
                      <span className={`${styles.rankBadge} ${styles[`rank${index + 1}`] || ''}`}>
                        #{index + 1}
                      </span>
                      <div className={styles.clubIdentity}>
                        {club.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={club.logo} alt={clubName} className={styles.clubLogo} />
                        ) : (
                          <span className={styles.clubLogoFallback}>{clubName.charAt(0)}</span>
                        )}
                        <span className={styles.clubName}>{clubName}</span>
                      </div>
                    </div>

                    {/* Ratio progress bar */}
                    <div className={styles.ratioBarBox}>
                      <div className={styles.ratioBar}>
                        <div
                          className={styles.ratioBarIn}
                          style={{ width: `${inPercent}%` }}
                          title={`+${club.in} ${pick(locale, 'قادمون', 'in')}`}
                        />
                        <div
                          className={styles.ratioBarOut}
                          style={{ width: `${100 - inPercent}%` }}
                          title={`-${club.out} ${pick(locale, 'مغادرون', 'out')}`}
                        />
                      </div>
                    </div>

                    {/* Stats & Pills Footer */}
                    <div className={styles.clubStatsFooter}>
                      <div className={styles.clubPills}>
                        <span className={styles.pillInBadge}>
                          ↓ {club.in} {pick(locale, 'قادم', 'in')}
                        </span>
                        <span className={styles.pillOutBadge}>
                          ↑ {club.out} {pick(locale, 'مغادر', 'out')}
                        </span>
                      </div>
                      <span className={styles.clubTotalBadge}>
                        {totalMoves} {pick(locale, 'صفقات', 'moves')}
                      </span>
                    </div>
                  </div>
                );

                return club.slug ? (
                  <Link key={club.name} href={`/team/${club.slug}`} className={styles.clubLinkWrapper}>
                    {CardContent}
                  </Link>
                ) : (
                  <div key={club.name} className={styles.clubLinkWrapper}>
                    {CardContent}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* 4. THE MERCATO WIRE (MONTHLY TIMELINE) */}
        {desk.rows.length === 0 ? (
          <div className="salon-empty rounded-3xl border border-dashed border-border p-12 text-center">
            <strong className="text-lg font-black">{pick(locale, 'لا توجد صفقات مسجلة لهذه الفلاتر', 'No moves found')}</strong>
            <p className="mt-2 text-sm text-muted-foreground">
              {pick(
                locale,
                'جرب تغيير النادي أو الموسم أو النافذة، أو اضغط على مسح الفلاتر لعرض كافة الصفقات.',
                'Try changing club or season filters, or click reset to see all moves.',
              )}
            </p>
          </div>
        ) : (
          <div className={styles.wire}>
            {groups.map((group) => (
              <section key={group.key} className={styles.monthBlock}>
                <div className={styles.monthHead}>
                  <h2>
                    <Calendar className="h-4 w-4 text-primary" />
                    {monthLabel(group.label, locale)}
                  </h2>
                  <span className={styles.monthCount}>
                    {group.rows.length} {pick(locale, 'صفقة', 'deals')}
                  </span>
                </div>
                <ul className={styles.moveList}>
                  {group.rows.map((row) => {
                    const name = localizePlainName(locale, row.playerName);
                    const from = row.fromTeam ? localizePlainName(locale, row.fromTeam) : '—';
                    const to = row.toTeam ? localizePlainName(locale, row.toTeam) : '—';
                    const kindClass =
                      row.kind === 'loan'
                        ? styles.kindLoan
                        : row.kind === 'free'
                          ? styles.kindFree
                          : styles.kindOfficial;

                    return (
                      <li key={row.id}>
                        <div className={styles.moveCard}>
                          {/* Player Avatar + Name */}
                          <div className={styles.movePlayer}>
                            <TransferFace
                              src={row.playerPhoto}
                              name={name}
                              className={styles.playerAvatar}
                              fallbackClassName={styles.playerInitial}
                            />
                            <div className={styles.playerMeta}>
                              {row.playerSlug ? (
                                <Link href={`/player/${row.playerSlug}`} className={styles.playerName}>
                                  {name}
                                </Link>
                              ) : (
                                <span className={styles.playerName}>{name}</span>
                              )}
                              <span className={styles.moveDate}>
                                {new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ar-EG', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  timeZone: 'UTC',
                                }).format(row.date)}
                              </span>
                            </div>
                          </div>

                          {/* Transfer Route Corridor */}
                          <div className={styles.moveCorridor}>
                            <span className={styles.teamPill}>
                              {row.fromLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={row.fromLogo} alt="" className={styles.teamLogo} />
                              ) : null}
                              {row.fromSlug ? (
                                <Link href={`/team/${row.fromSlug}`}>{from}</Link>
                              ) : (
                                <em>{from}</em>
                              )}
                            </span>

                            <span className={styles.corridorArrow}>
                              {ar ? '←' : '→'}
                            </span>

                            <span className={styles.teamPill}>
                              {row.toLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={row.toLogo} alt="" className={styles.teamLogo} />
                              ) : null}
                              {row.toSlug ? (
                                <Link href={`/team/${row.toSlug}`}>{to}</Link>
                              ) : (
                                <em>{to}</em>
                              )}
                            </span>
                          </div>

                          {/* Meta: Kind + Fee */}
                          <div className={styles.moveMeta}>
                            <span className={styles.verifiedBadge}>
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {pick(locale, 'مؤكدة رسمياً', 'Confirmed')}
                            </span>
                            <span className={`${styles.kindBadge} ${kindClass}`}>
                              {localizeTransferType(locale, row.type, row.kind)}
                            </span>
                            <span className={`${styles.feeBadge} ${row.fee ? '' : styles.feeUndisclosed}`}>
                              {row.fee || pick(locale, 'غير معلنة', 'Undisclosed')}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </SalonStage>
  );
}

