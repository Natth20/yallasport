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
import { SalonStage } from '@/components/salon/SalonStage';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { NormalizedScorer } from '@/lib/sports-data/types';

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

const OPEN_LEAGUE_IDS = ['2', '39', '140', '307', '135', '78', '61', '3'] as const;

export async function PredictionsHouse() {
  const t = await getTranslations('board');
  const locale = await getLocale();
  const session = await auth();
  const now = new Date();
  const season = String(currentFootballSeason());
  const openWhere = {
    status: 'NOT_STARTED' as const,
    kickoffAt: { gte: now },
    league: { externalId: { in: [...OPEN_LEAGUE_IDS] } },
  };
  const participantWhere = { OR: [{ points: { gt: 0 } }, { predictions: { some: {} } }] };

  const [rows, peopleCount, pointsAgg] = await Promise.all([
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
  ]);

  const [slipCount, settledCount, openCount] = await Promise.all([
    prisma.prediction.count(),
    prisma.prediction.count({ where: { isCorrect: { not: null } } }),
    prisma.match.count({ where: openWhere }),
  ]);

  const [openMatches, moodRows, me] = await Promise.all([
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
  ]);

  const liveMeta = await safeRedisGet<{ syncedAt?: string; predictionsSettled?: number }>('sports:meta:live');
  const scorerPacks: NormalizedScorer[][] = [];
  let scorerSeason = season;
  for (const league of SCORER_LEAGUES) {
    let pack = await sportsData.getTopScorers(league.id, season).catch(swallow('PredictionsHouse.scorers', []));
    if (!pack?.length) {
      const previous = String(Number(season) - 1);
      pack = await sportsData.getTopScorers(league.id, previous).catch(swallow('PredictionsHouse.scorers', []));
      if (pack?.length) scorerSeason = previous;
    }
    scorerPacks.push(pack || []);
  }

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
      name: localizePlainName(locale, s.player.name),
      slug: slugByExt.get(s.player.id) || scorerDeskSlug(s.player.name, s.player.id),
      photoUrl: s.player.photoUrl || null,
      teamName: s.teamName ? localizePlainName(locale, s.teamName) : undefined,
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
    <SalonStage
      tone="podium"
      wide
      kicker={`${t('house')} · ${now.getFullYear()}`}
      title={t('headline')}
      lead={`${t('standfirst')} ${t('points_rule')}`}
      aside={
        liveMeta?.syncedAt ? (
          <span>
            {t('last_settled')}: <ClientTime value={liveMeta.syncedAt} />
          </span>
        ) : undefined
      }
      tools={
        <div className="salon-foyer">
          <nav className="salon-tabs" aria-label={t('toc_kicker')}>
            <a href="#board-desk" className="salon-tab">{t('nav_desk')}</a>
            <a href="#board-open" className="salon-tab">{t('nav_open')}</a>
            <a href="#board-table" className="salon-tab">{t('nav_table')}</a>
            <a href="#board-rules" className="salon-tab">{t('nav_rules')}</a>
          </nav>
        </div>
      }
    >
      <div className={styles['ph-stack']}>
        <section id="board-desk" className={styles['ph-split']}>
          <div className={styles['ph-tally']}>
            {tally.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <aside className={styles['ph-place']}>
            <p>{t('place_kicker')}</p>
            {me ? (
              onBoard ? (
                <>
                  <strong>{me.name || t('unnamed')}</strong>
                  <em>
                    #{myRank} · {me.points} {t('col_points')} · {me._count.predictions} {t('col_slips')}
                  </em>
                  <span>
                    {accuracy != null ? (
                      <i className={`${styles['ph-chip']} ${styles['is-ok']}`}>
                        {t('accuracy')}: {accuracy}%
                      </i>
                    ) : null}
                    {streak > 0 ? (
                      <i className={`${styles['ph-chip']} ${styles['is-wait']}`}>
                        {t('streak')}: {streak}
                      </i>
                    ) : null}
                  </span>
                </>
              ) : (
                <>
                  <em>{t('place_none')}</em>
                  <Link href="/matches" className={styles['ph-go']}>{t('empty_cta')}</Link>
                </>
              )
            ) : (
              <>
                <em>{t('login_hint')}</em>
                <Link href="/login" className={styles['ph-go']}>{t('login_cta')}</Link>
              </>
            )}
          </aside>
        </section>

        {me && myHistory.length > 0 ? (
          <section className={styles['ph-block']}>
            <header className={styles['ph-head']}>
              <h2>{t('your_ledger')}</h2>
            </header>
            <div className={styles['ph-ledger']}>
              {myHistory.map((slip) => (
                <Link key={slip.match.id} href={`/match/${slip.match.id}`} className={styles['ph-slip']}>
                  <strong>
                    {localizePlainName(locale, slip.match.homeTeam.name)} × {localizePlainName(locale, slip.match.awayTeam.name)}
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
          <section className={styles['ph-block']}>
            <header className={styles['ph-head']}>
              <p>{t('podium_kicker')}</p>
              <h2>{t('podium_title')}</h2>
            </header>
            <div className={styles['ph-podium']}>
              {podium.map((seat, index) => {
                const place = index + 1;
                return (
                  <article key={seat.id} className={`${styles['ph-seat']} ${styles['ph-card']}`}>
                    {place === 1 ? <span className={styles['ph-crown']}>{t('champion')}</span> : null}
                    <span className={styles['ph-medal']} aria-hidden>
                      {String(place).padStart(2, '0')}
                    </span>
                    <div className={styles['ph-seat-face']}>
                      {seat.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={seat.image} alt="" />
                      ) : (
                        initials(seat.name)
                      )}
                    </div>
                    <h3>{seat.name || t('unnamed')}</h3>
                    <b>
                      {seat.points} {t('col_points')}
                    </b>
                  </article>
                );
              })}
            </div>
          </section>
        ) : peopleCount === 0 ? (
          <p className={styles['ph-empty']}>{t('empty_body')}</p>
        ) : null}

        {moodTotal > 0 ? (
          <section className={styles['ph-mood']}>
            <header className={styles['ph-head']}>
              <p>{t('mood_kicker')}</p>
              <h2>{t('mood_title')}</h2>
              <em>
                {moodTotal} {t('mood_count')}
              </em>
            </header>
            <div className={styles['ph-mood-bar']}>
              {mood.map((item) => {
                const pct = Math.round((item.value / moodTotal) * 100);
                return (
                  <i key={item.key} style={{ width: `${pct}%`, background: item.color }} title={`${item.label}: ${pct}%`} />
                );
              })}
            </div>
            <div className={styles['ph-mood-grid']}>
              {mood.map((item) => {
                const pct = Math.round((item.value / moodTotal) * 100);
                return (
                  <div key={item.key}>
                    <span>{item.label}</span>
                    <b>{pct}%</b>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section id="board-open" className={styles['ph-block']}>
          <header className={styles['ph-head']}>
            <p>{t('prog_kicker')}</p>
            <h2>{t('prog_title')}</h2>
            <Link href="/matches">{t('door_matches')}</Link>
          </header>
          {openMatches.length === 0 ? (
            <p className={styles['ph-empty']}>{t('prog_empty')}</p>
          ) : (
            <div className={styles['ph-kicks']}>
              {openMatches.map((match) => {
                const mine = myByMatch.get(match.id);
                const home = localizePlainName(locale, match.homeTeam.name);
                const away = localizePlainName(locale, match.awayTeam.name);
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className={styles['ph-kick']}>
                    <span>
                      {localizePlainName(locale, match.league.name)}
                      <ClientTime value={match.kickoffAt} options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }} />
                    </span>
                    <strong>
                      <CrestImage src={match.homeTeam.logoUrl} name={home} size={22} />
                      {home}
                    </strong>
                    <strong>
                      <CrestImage src={match.awayTeam.logoUrl} name={away} size={22} />
                      {away}
                    </strong>
                    <em>
                      {match._count.predictions} {t('prog_slips')}
                      {mine ? (
                        <i className={`${styles['ph-chip']} ${styles['is-ok']}`}>{t('prog_yours')}</i>
                      ) : (
                        <b>{t('prog_open')}</b>
                      )}
                    </em>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section id="board-table" className={styles['ph-block']}>
          <header className={styles['ph-head']}>
            <p>{t('list_kicker')}</p>
            <h2>{t('list_title')}</h2>
            <em>
              {peopleCount} {t('racers')}
              {realScorerItems.length > 0 ? ` · ${realScorerItems.length} ${t('scorers_count')}` : ''}
              {` · ${scorerSeason}/${Number(scorerSeason) + 1}`}
            </em>
          </header>
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
              you: t('you'),
              allLeagues: t('all_leagues'),
            }}
          />
        </section>

        <section id="board-rules" className={styles['ph-rules']}>
          <header className={styles['ph-head']}>
            <h2>{t('rules_title')}</h2>
          </header>
          <div className={styles['ph-rule-grid']}>
            {rules.map((rule) => (
              <article key={rule.no}>
                <em>{rule.no}</em>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SalonStage>
  );
}
