import { swallow } from '@/lib/ops/caught';
import { ClientTime } from '@/components/datetime/ClientTime';
import { CrestImage } from '@/components/common/CrestImage';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { safeRedisGet } from '@/lib/redis';
import { LeaderboardExplorer, UserRankItem, RealScorerItem } from './LeaderboardExplorer';
import { getLocale, getTranslations } from 'next-intl/server';
import { predictionAccuracy, rankByPoints, scorerDeskSlug, settledStreak } from '@/lib/predictions/rank';
import styles from './predictions-house.module.css';

function initials(name: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const SCORER_LEAGUES = [
  { id: '39', ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League' },
  { id: '140', ar: 'الليغا', en: 'La Liga' },
  { id: '2', ar: 'دوري أبطال أوروبا', en: 'UEFA Champions League' },
  { id: '307', ar: 'دوري روشن السعودي', en: 'Saudi Pro League' },
] as const;

export async function PredictionsHouse() {
  const t = await getTranslations('board');
  const locale = await getLocale();
  const session = await auth();
  const now = new Date();
  const season = String(currentFootballSeason());
  const openWhere = { status: 'NOT_STARTED' as const, kickoffAt: { gte: now } };
  const participantWhere = { OR: [{ points: { gt: 0 } }, { predictions: { some: {} } }] };

  const [
    rows,
    peopleCount,
    pointsAgg,
    slipCount,
    settledCount,
    openCount,
    openMatches,
    moodRows,
    me,
    liveMeta,
    ...scorerPacks
  ] = await Promise.all([
    prisma.user.findMany({
      where: participantWhere,
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        _count: { select: { predictions: true } },
      },
      orderBy: [{ points: 'desc' }, { predictions: { _count: 'desc' } }],
      take: 80,
    }),
    prisma.user.count({ where: participantWhere }),
    prisma.user.aggregate({ where: participantWhere, _sum: { points: true } }),
    prisma.prediction.count(),
    prisma.prediction.count({ where: { isCorrect: { not: null } } }),
    prisma.match.count({ where: openWhere }),
    prisma.match.findMany({
      where: openWhere,
      orderBy: { kickoffAt: 'asc' },
      take: 8,
      select: {
        id: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        league: { select: { name: true } },
        _count: { select: { predictions: true } },
      },
    }),
    prisma.prediction.groupBy({
      by: ['predictedOutcome'],
      _count: { _all: true },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          points: true,
          _count: { select: { predictions: true } },
        },
      })
      : Promise.resolve(null),
    safeRedisGet<{ syncedAt?: string; predictionsSettled?: number }>('sports:meta:live'),
    ...SCORER_LEAGUES.map((league) =>
      sportsData.getTopScorers(league.id, season).catch(swallow('PredictionsHouse.scorers', [])),
    ),
  ]);

  const scorerIds = scorerPacks.flatMap((pack) => (pack || []).map((row) => row.player.id));
  const ledgerPlayers =
    scorerIds.length > 0
      ? await prisma.player.findMany({
        where: { externalId: { in: scorerIds } },
        select: { externalId: true, slug: true },
      })
      : [];
  const slugByExt = new Map(ledgerPlayers.map((row) => [row.externalId, row.slug]));

  const realScorerItems: RealScorerItem[] = SCORER_LEAGUES.flatMap((league, packIndex) =>
    (scorerPacks[packIndex] || []).map((s, idx) => ({
      id: `${league.id}-${s.player.id}`,
      name: s.player.name,
      slug: slugByExt.get(s.player.id) || scorerDeskSlug(s.player.name, s.player.id),
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName,
      goals: s.goals,
      leagueName: locale === 'ar' ? league.ar : league.en,
      rank: idx + 1,
    })),
  );

  const myOpenSlips = me
    ? await prisma.prediction.findMany({
      where: { userId: me.id, matchId: { in: openMatches.map((match) => match.id) } },
      select: { matchId: true, predictedOutcome: true },
    })
    : [];
  const myByMatch = new Map(myOpenSlips.map((slip) => [slip.matchId, slip.predictedOutcome]));

  const myHistory = me
    ? await prisma.prediction.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        predictedOutcome: true,
        isCorrect: true,
        pointsAwarded: true,
        match: {
          select: {
            id: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
    })
    : [];
  const mySettled = me
    ? await prisma.prediction.groupBy({
      by: ['isCorrect'],
      where: { userId: me.id, isCorrect: { not: null } },
      _count: { _all: true },
    })
    : [];
  const settledOk = mySettled.find((row) => row.isCorrect === true)?._count._all ?? 0;
  const settledAll = mySettled.reduce((sum, row) => sum + row._count._all, 0);
  const accuracy = predictionAccuracy(settledOk, settledAll);
  const streak = settledStreak(myHistory);

  const aboveMe = me
    ? await prisma.user.count({
      where: { AND: [participantWhere, { points: { gt: me.points } }] },
    })
    : 0;
  const myRank = me && me._count.predictions > 0 ? rankByPoints(aboveMe) : null;

  const userRankItems: UserRankItem[] = rows.map((u, idx) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    points: u.points,
    predictionsCount: u._count.predictions,
    rank: idx + 1,
  }));

  const pointsOnBoard = pointsAgg._sum.points ?? 0;
  const podium = rows.filter((row) => row.points > 0).slice(0, 3);
  const onBoard = Boolean(myRank);

  const moodMap = Object.fromEntries(moodRows.map((row) => [row.predictedOutcome, row._count._all]));
  const mood = [
    { key: 'HOME_WIN', label: t('door_home'), value: moodMap.HOME_WIN ?? 0, color: 'var(--ys-green)' },
    { key: 'DRAW', label: t('door_draw'), value: moodMap.DRAW ?? 0, color: 'var(--ys-orange)' },
    { key: 'AWAY_WIN', label: t('door_away'), value: moodMap.AWAY_WIN ?? 0, color: '#22d3ee' },
  ];
  const moodTotal = mood.reduce((sum, item) => sum + item.value, 0);

  const tally = [
    { value: openCount, label: t('tally_open') },
    { value: peopleCount, label: t('tally_people') },
    { value: slipCount, label: t('tally_slips') },
    { value: pointsOnBoard, label: t('tally_points') },
    { value: settledCount, label: t('tally_settled') },
  ];

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  const outcomeLabel = (value: string) =>
    value === 'HOME_WIN' ? t('door_home') : value === 'AWAY_WIN' ? t('door_away') : t('door_draw');

  return (
    <div className="predictions-house relative min-h-screen overflow-hidden pb-16">
      <div className="mx-auto max-w-7xl space-y-12 px-4 pt-8 sm:px-6 lg:px-8">
        <header className={styles['ph-hero']}>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className={styles['ph-kicker']}>
                  {t('house')} · {t('folio')}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500">{now.getFullYear()}</span>
                {liveMeta?.syncedAt ? (
                  <span className="text-xs text-muted-foreground">
                    {t('last_settled')}: <ClientTime value={liveMeta.syncedAt} />
                  </span>
                ) : null}
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">{t('headline')}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t('standfirst')}</p>
                <p className="text-xs font-bold text-primary">{t('points_rule')}</p>
              </div>
              <div className={styles['ph-tally']}>
                {tally.map((item) => (
                  <article key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className={`${styles['ph-card']} space-y-4 rounded-2xl border-amber-500/30 p-6`}>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500">{t('place_kicker')}</span>
                  {onBoard && myRank ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                      #{myRank}
                    </span>
                  ) : null}
                </div>
                {me ? (
                  onBoard ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/20 font-bold text-amber-400">
                          {initials(me.name)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{me.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {me.points} {t('col_points')} · {me._count.predictions} {t('col_slips')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        {accuracy != null ? (
                          <span className={`${styles['ph-chip']} ${styles['is-ok']}`}>
                            {t('accuracy')}: {accuracy}%
                          </span>
                        ) : null}
                        {streak > 0 ? (
                          <span className={`${styles['ph-chip']} ${styles['is-wait']}`}>
                            {t('streak')}: {streak}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{t('place_none')}</p>
                      <Link href="/matches" className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                        {t('empty_cta')}
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t('login_hint')}</p>
                    <Link href="/login" className="inline-flex rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black">
                      {t('login_cta')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {me && myHistory.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black">{t('your_ledger')}</h2>
            <div className={styles['ph-ledger']}>
              {myHistory.map((slip) => (
                <Link key={slip.match.id} href={`/match/${slip.match.id}`} className={styles['ph-slip']}>
                  <strong className="text-sm">
                    {slip.match.homeTeam.name} × {slip.match.awayTeam.name}
                  </strong>
                  <em>
                    {outcomeLabel(slip.predictedOutcome)}
                    {slip.pointsAwarded ? ` · ${slip.pointsAwarded}` : ''}
                  </em>
                  <span
                    className={`${styles['ph-chip']} ${slip.isCorrect === true ? styles['is-ok'] : slip.isCorrect === false ? styles['is-no'] : styles['is-wait']
                      }`}
                  >
                    {slip.isCorrect === true ? t('slip_ok') : slip.isCorrect === false ? t('slip_miss') : t('slip_wait')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {podium.length > 0 ? (
          <section className="space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500">{t('podium_kicker')}</span>
              <h2 className="text-2xl font-black text-foreground sm:text-3xl">{t('podium_title')}</h2>
            </div>
            <div className={`${styles['ph-podium']} mx-auto max-w-4xl`}>
              {[podium[1], podium[0], podium[2]].map((seat, visual) => {
                if (!seat) return <div key={visual} />;
                const place = visual === 1 ? 1 : visual === 0 ? 2 : 3;
                const seatClass = place === 1 ? styles['is-gold'] : place === 2 ? styles['is-silver'] : styles['is-bronze'];
                return (
                  <article key={seat.id} className={`${styles['ph-seat']} ${styles['ph-card']} ${styles[`is-place-${place}`]} ${seatClass}`}>
                    {place === 1 ? <span className={styles['ph-crown']}>👑 {t('champion')}</span> : null}
                    <span className={`${styles['ph-medal']} ${styles[`is-${place}`]}`} aria-hidden>
                      <b>{place}</b>
                    </span>
                    <div className={`${styles['ph-seat-face']} mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl font-bold`}>
                      {seat.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={seat.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(seat.name)
                      )}
                    </div>
                    <h3 className="truncate text-base font-bold">{seat.name || t('unnamed')}</h3>
                    <p className="mt-2 font-mono text-xs font-bold">
                      {seat.points} {t('col_points')}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : peopleCount === 0 ? (
          <p className="rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            {t('empty_body')}
          </p>
        ) : null}

        {moodTotal > 0 ? (
          <section className={`${styles['ph-mood']} rounded-3xl p-6 sm:p-8`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('mood_kicker')}</p>
                <h2 className="mt-1 text-xl font-extrabold">{t('mood_title')}</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {moodTotal} {t('mood_count')}
              </span>
            </div>
            <div className={`${styles['ph-mood-bar']} mb-4`}>
              {mood.map((item) => {
                const pct = Math.round((item.value / moodTotal) * 100);
                return <i key={item.key} className="ys-grow-x" style={{ width: `${pct}%`, background: item.color }} title={`${item.label}: ${pct}%`} />;
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {mood.map((item) => {
                const pct = Math.round((item.value / moodTotal) * 100);
                return (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="font-mono text-sm font-black">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('prog_kicker')}</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">{t('prog_title')}</h2>
            </div>
            <Link href="/matches" className="text-xs font-bold text-primary hover:underline">
              {t('door_matches')}
            </Link>
          </div>
          {openMatches.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card/20 py-8 text-center text-xs text-muted-foreground">{t('prog_empty')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {openMatches.map((match) => {
                const mine = myByMatch.get(match.id);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-border pb-2 text-[11px]">
                      <span className="truncate text-muted-foreground">{match.league.name}</span>
                      <ClientTime value={match.kickoffAt} className="font-mono font-bold text-primary" />
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="flex items-center gap-2">
                        <CrestImage src={match.homeTeam.logoUrl} name={match.homeTeam.name} size={20} className="h-5 w-5 object-contain" />
                        <span className="truncate text-xs font-bold">{match.homeTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CrestImage src={match.awayTeam.logoUrl} name={match.awayTeam.name} size={20} className="h-5 w-5 object-contain" />
                        <span className="truncate text-xs font-bold">{match.awayTeam.name}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px]">
                      <span className="font-mono text-muted-foreground">
                        {match._count.predictions} {t('prog_slips')}
                      </span>
                      {mine ? (
                        <span className={`${styles['ph-chip']} ${styles['is-ok']}`}>{t('prog_yours')}</span>
                      ) : (
                        <span className="font-bold text-primary">{t('prog_open')}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('list_kicker')}</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">{t('list_title')}</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {peopleCount} {t('racers')} · {realScorerItems.length} {t('scorers_count')} · {season}/{Number(season) + 1}
            </span>
          </div>
          <LeaderboardExplorer
            userRanks={userRankItems}
            realScorers={realScorerItems}
            currentUserId={me?.id}
            locale={locale}
            labels={{
              searchPlaceholder: t('search_placeholder'),
              voiceListening: t('voice_listening'),
              voiceUnsupported: t('voice_unsupported'),
              tabUsers: t('tab_users'),
              tabScorers: t('tab_scorers'),
              colRank: t('col_rank'),
              colName: t('col_name'),
              colPredictions: t('col_slips'),
              colPoints: t('col_points'),
              colGoals: t('col_goals'),
              colTeam: t('col_team'),
              colLeague: t('col_league'),
              emptyMessage: t('search_empty'),
              clearSearch: t('clear_search'),
            }}
          />
        </section>

        <section className={`${styles['ph-rules']} rounded-3xl p-6 sm:p-8`}>
          <h2 className="mb-4 text-lg font-bold">{t('rules_title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule) => (
              <div key={rule.no} className="rounded-2xl border border-border bg-card p-4">
                <span className="font-mono text-xs font-bold text-primary">{rule.no}</span>
                <h3 className="mt-1.5 mb-1 text-xs font-bold">{rule.title}</h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{rule.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
