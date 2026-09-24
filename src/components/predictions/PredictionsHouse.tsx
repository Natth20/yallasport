import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { LeaderboardExplorer, UserRankItem, RealScorerItem } from './LeaderboardExplorer';
import { getLocale, getTranslations } from 'next-intl/server';

function initials(name: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export async function PredictionsHouse() {
  const t = await getTranslations('board');
  const locale = await getLocale();
  const session = await auth();
  const now = new Date();
  const openWhere = { status: 'NOT_STARTED' as const, kickoffAt: { gte: now } };

  const [
    rows,
    slipCount,
    settledCount,
    openCount,
    openMatches,
    moodRows,
    me,
    eplScorers,
    laligaScorers,
    uclScorers,
    splScorers,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [{ points: { gt: 0 } }, { predictions: { some: {} } }],
      },
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        _count: { select: { predictions: true } },
      },
      take: 80,
    }),
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
    sportsData.getTopScorers('39', '2024').catch(() => []),
    sportsData.getTopScorers('140', '2024').catch(() => []),
    sportsData.getTopScorers('2', '2024').catch(() => []),
    sportsData.getTopScorers('307', '2024').catch(() => []),
  ]);

  const realScorerItems: RealScorerItem[] = [
    ...(eplScorers || []).map((s: any, idx: number) => ({
      id: `epl-${s.player.id}`,
      name: s.player.name,
      slug: s.player.slug,
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName,
      goals: s.goals,
      leagueName: locale === 'ar' ? 'الدوري الإنجليزي الممتاز' : 'Premier League',
      rank: idx + 1,
    })),
    ...(laligaScorers || []).map((s: any, idx: number) => ({
      id: `laliga-${s.player.id}`,
      name: s.player.name,
      slug: s.player.slug,
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName,
      goals: s.goals,
      leagueName: locale === 'ar' ? 'الدوري الإسباني (لا ليغا)' : 'La Liga',
      rank: idx + 1,
    })),
    ...(uclScorers || []).map((s: any, idx: number) => ({
      id: `ucl-${s.player.id}`,
      name: s.player.name,
      slug: s.player.slug,
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName,
      goals: s.goals,
      leagueName: locale === 'ar' ? 'دوري أبطال أوروبا' : 'UEFA Champions League',
      rank: idx + 1,
    })),
    ...(splScorers || []).map((s: any, idx: number) => ({
      id: `spl-${s.player.id}`,
      name: s.player.name,
      slug: s.player.slug,
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName,
      goals: s.goals,
      leagueName: locale === 'ar' ? 'دوري روشن السعودي' : 'Saudi Pro League',
      rank: idx + 1,
    })),
  ];

  const mySlips = me
    ? await prisma.prediction.findMany({
        where: { userId: me.id, matchId: { in: openMatches.map((match) => match.id) } },
        select: { matchId: true, predictedOutcome: true },
      })
    : [];
  const myByMatch = new Map(mySlips.map((slip) => [slip.matchId, slip.predictedOutcome]));

  const ranked = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b._count.predictions - a._count.predictions;
  });

  const userRankItems: UserRankItem[] = ranked.map((u, idx) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    points: u.points,
    predictionsCount: u._count.predictions,
    rank: idx + 1,
  }));

  const pointsOnBoard = ranked.reduce((sum, row) => sum + row.points, 0);
  const podium = ranked.filter((row) => row.points > 0).slice(0, 3);
  const myIndex = me ? ranked.findIndex((row) => row.id === me.id) : -1;
  const onBoard = myIndex >= 0;

  const moodMap = Object.fromEntries(moodRows.map((row) => [row.predictedOutcome, row._count._all]));
  const mood = [
    { key: 'HOME_WIN', label: t('door_home'), value: moodMap.HOME_WIN ?? 0, color: 'bg-emerald-500' },
    { key: 'DRAW', label: t('door_draw'), value: moodMap.DRAW ?? 0, color: 'bg-amber-500' },
    { key: 'AWAY_WIN', label: t('door_away'), value: moodMap.AWAY_WIN ?? 0, color: 'bg-cyan-500' },
  ];
  const moodTotal = mood.reduce((sum, item) => sum + item.value, 0);

  const tally = [
    { value: openCount, label: t('tally_open') },
    { value: ranked.length, label: t('tally_people') },
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

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Dynamic Arena Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-amber-500/15 via-primary/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 pt-8">
        {/* ——— Hero: The Champions Arena ——— */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold tracking-wider text-amber-400 uppercase border border-amber-500/30">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  {t('house')} · {t('folio')}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  SEASON 2026
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {t('headline')}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  {t('standfirst')}
                </p>
              </div>

              {/* Tally Stats Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {tally.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <span className="font-mono text-xl font-black text-white block">{item.value}</span>
                    <span className="text-[11px] text-muted-foreground truncate block mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: User Ranking Card */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card/50 to-card/20 p-6 backdrop-blur-md shadow-inner space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                    {locale === 'en' ? 'Your Standing' : 'بطاقة ترتيبك'}
                  </span>
                  {onBoard && (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                      #{myIndex + 1}
                    </span>
                  )}
                </div>

                {me ? (
                  onBoard ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40">
                          {initials(me.name)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{me.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {me.points} {t('col_points')} · {me._count.predictions} {t('col_slips')}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium">
                        {locale === 'en' ? 'You are competing on the official board!' : 'أنت منافس معتمد في جدول الترتيب الرسمي!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{t('place_none')}</p>
                      <Link
                        href="/matches"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                      >
                        {t('empty_cta')}
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {locale === 'en'
                        ? 'Sign in to log your predictions and climb the hall of fame.'
                        : 'سجل دخولك لوضع توقعاتك ودخول لوحة الشرف الرسمية.'}
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
                    >
                      {t('login_cta')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ——— Top 3 Champions Podium ——— */}
        {podium.length > 0 && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                TOP PREDICTORS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {locale === 'en' ? 'The Champions Podium' : 'منصة التتويج الكبرى'}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto items-end pt-4">
              {/* 2nd Place */}
              {podium[1] && (
                <div className="order-2 sm:order-1 rounded-3xl border border-slate-400/30 bg-gradient-to-b from-slate-400/10 via-card/50 to-card/20 p-6 text-center backdrop-blur-xl shadow-xl transition-all hover:scale-105">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/20 text-slate-300 font-mono text-sm font-black border border-slate-400/30 mb-4">
                    2
                  </span>
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-400/15 border-2 border-slate-400/40 text-slate-200 font-bold overflow-hidden">
                    {podium[1].image ? <img src={podium[1].image} alt="" className="h-full w-full object-cover" /> : initials(podium[1].name)}
                  </div>
                  <h3 className="font-bold text-white text-base truncate">{podium[1].name || t('unnamed')}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-400/10 px-3 py-1 font-mono text-xs font-bold text-slate-300">
                    <span>{podium[1].points}</span>
                    <span className="text-[10px] text-muted-foreground">{t('col_points')}</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Winner - Raised) */}
              {podium[0] && (
                <div className="order-1 sm:order-2 rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/25 via-card/70 to-card/30 p-8 text-center backdrop-blur-xl shadow-2xl shadow-amber-500/10 transition-all hover:scale-105 relative -mt-4">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md">
                    CHAMPION 👑
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 font-mono text-base font-black border border-amber-400/40 mb-4">
                    1
                  </span>
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-xl overflow-hidden shadow-lg shadow-amber-500/20">
                    {podium[0].image ? <img src={podium[0].image} alt="" className="h-full w-full object-cover" /> : initials(podium[0].name)}
                  </div>
                  <h3 className="font-extrabold text-white text-lg truncate">{podium[0].name || t('unnamed')}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-4 py-1.5 font-mono text-sm font-black text-amber-300 border border-amber-400/30">
                    <span>{podium[0].points}</span>
                    <span className="text-xs text-amber-400/80">{t('col_points')}</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <div className="order-3 sm:order-3 rounded-3xl border border-amber-700/30 bg-gradient-to-b from-amber-700/10 via-card/50 to-card/20 p-6 text-center backdrop-blur-xl shadow-xl transition-all hover:scale-105">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 font-mono text-sm font-black border border-amber-700/30 mb-4">
                    3
                  </span>
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-700/15 border-2 border-amber-700/40 text-amber-600 font-bold overflow-hidden">
                    {podium[2].image ? <img src={podium[2].image} alt="" className="h-full w-full object-cover" /> : initials(podium[2].name)}
                  </div>
                  <h3 className="font-bold text-white text-base truncate">{podium[2].name || t('unnamed')}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-700/10 px-3 py-1 font-mono text-xs font-bold text-amber-500">
                    <span>{podium[2].points}</span>
                    <span className="text-[10px] text-muted-foreground">{t('col_points')}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ——— Global Community Sentiment (Mood Tracker) ——— */}
        <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{t('mood_kicker')}</p>
              <h2 className="text-xl font-extrabold text-white mt-1">{t('mood_title')}</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {moodTotal} {locale === 'en' ? 'Total Slips Analyzed' : 'توقع مسجل في البورصة'}
            </span>
          </div>

          {/* Unified Sentiment Progress Bar */}
          <div className="h-4 w-full overflow-hidden rounded-full bg-white/5 flex mb-4">
            {mood.map((item) => {
              const pct = moodTotal ? Math.round((item.value / moodTotal) * 100) : 0;
              return (
                <div
                  key={item.key}
                  style={{ width: `${pct}%` }}
                  className={`${item.color} h-full transition-all duration-500 first:rounded-s-full last:rounded-e-full`}
                  title={`${item.label}: ${pct}%`}
                />
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {mood.map((item) => {
              const pct = moodTotal ? Math.round((item.value / moodTotal) * 100) : 0;
              return (
                <div key={item.key} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-bold text-white">{item.label}</span>
                  </div>
                  <div className="text-end">
                    <span className="font-mono text-sm font-black text-white">{pct}%</span>
                    <span className="block text-[10px] text-muted-foreground font-mono">({item.value})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ——— Open Prediction Fixtures ——— */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{t('prog_kicker')}</p>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{t('prog_title')}</h2>
            </div>
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              {t('door_matches')} →
            </Link>
          </div>

          {openMatches.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 rounded-2xl border border-white/5 bg-card/20">
              {t('prog_empty')}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {openMatches.map((match) => {
                const mine = myByMatch.get(match.id);
                return (
                  <Link
                    key={match.id}
                    href={`/match/${match.id}`}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-card/40 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-card/70 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 text-[11px]">
                      <span className="text-muted-foreground truncate">{match.league.name}</span>
                      <ClientTime value={match.kickoffAt} className="font-mono font-bold text-primary" />
                    </div>

                    <div className="space-y-2 py-1">
                      <div className="flex items-center gap-2">
                        {match.homeTeam.logoUrl && <img src={match.homeTeam.logoUrl} alt="" className="h-5 w-5 object-contain" />}
                        <span className="text-xs font-bold text-white truncate">{match.homeTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {match.awayTeam.logoUrl && <img src={match.awayTeam.logoUrl} alt="" className="h-5 w-5 object-contain" />}
                        <span className="text-xs font-bold text-white truncate">{match.awayTeam.name}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-mono">
                        {match._count.predictions} {t('prog_slips')}
                      </span>
                      {mine ? (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          {t('prog_yours')}
                        </span>
                      ) : (
                        <span className="text-primary font-bold group-hover:underline">
                          {t('prog_open')} →
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ——— Full Interactive Leaderboard & Scorers Explorer with Voice Search ——— */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{t('list_kicker')}</p>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{t('list_title')}</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {ranked.length} {locale === 'en' ? 'Racers' : 'متسابق'} · {realScorerItems.length} {locale === 'en' ? 'Top Scorers' : 'هدّاف عالمي'}
            </span>
          </div>

          <LeaderboardExplorer
            userRanks={userRankItems}
            realScorers={realScorerItems}
            currentUserId={me?.id}
            locale={locale}
            labels={{
              searchPlaceholder: locale === 'ar' ? 'ابحث عن متسابق، لاعب، أو فريق بالاسم أو الصوت...' : 'Search racer, player, or team by name or voice...',
              voiceListening: locale === 'ar' ? 'جارٍ الاستماع... تحدث الآن 🎙️' : 'Listening... Speak now 🎙️',
              voiceUnsupported: locale === 'ar' ? 'المتصفح لا يدعم البحث الصوتي المباشر' : 'Voice search is not supported in this browser',
              tabUsers: locale === 'ar' ? '🏆 متصدرو التوقعات' : '🏆 Community Leaderboard',
              tabScorers: locale === 'ar' ? '⚽ هدافو الدوريات العالمية' : '⚽ Global Top Scorers',
              colRank: locale === 'ar' ? 'الترتيب' : 'Rank',
              colName: locale === 'ar' ? 'الاسم' : 'Name',
              colPredictions: locale === 'ar' ? 'التوقعات' : 'Slips',
              colPoints: locale === 'ar' ? 'النقاط' : 'Points',
              colGoals: locale === 'ar' ? 'الأهداف' : 'Goals',
              colTeam: locale === 'ar' ? 'الفريق' : 'Team',
              colLeague: locale === 'ar' ? 'البطولة' : 'League',
              emptyMessage: locale === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching results found',
              clearSearch: locale === 'ar' ? 'مسح البحث' : 'Clear search',
            }}
          />
        </section>

        {/* ——— Fair Play Rules ——— */}
        <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-4">{t('rules_title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule) => (
              <div key={rule.no} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <span className="font-mono text-xs font-bold text-primary">{rule.no}</span>
                <h3 className="text-xs font-bold text-white mt-1.5 mb-1">{rule.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
