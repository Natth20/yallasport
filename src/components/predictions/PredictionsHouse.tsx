import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
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
  const arabic = locale === 'ar';
  const kicker = arabic ? 'is-ar' : '';
  const session = await auth();
  const now = new Date();
  const openWhere = { status: 'NOT_STARTED' as const, kickoffAt: { gte: now } };

  const [rows, slipCount, settledCount, openCount, openMatches, moodRows, me] = await Promise.all([
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
  ]);

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

  const pointsOnBoard = ranked.reduce((sum, row) => sum + row.points, 0);
  const podium = ranked.filter((row) => row.points > 0).slice(0, 3);
  const myIndex = me ? ranked.findIndex((row) => row.id === me.id) : -1;
  const onBoard = myIndex >= 0;
  const hasSlip = (me?._count.predictions ?? 0) > 0 || (me?.points ?? 0) > 0;

  const moodMap = Object.fromEntries(moodRows.map((row) => [row.predictedOutcome, row._count._all]));
  const mood = [
    { key: 'HOME_WIN', label: t('door_home'), value: moodMap.HOME_WIN ?? 0 },
    { key: 'DRAW', label: t('door_draw'), value: moodMap.DRAW ?? 0 },
    { key: 'AWAY_WIN', label: t('door_away'), value: moodMap.AWAY_WIN ?? 0 },
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
    <article className="board-house is-marquee">
      <section className="rib-night">
        <span className="colophon-corner colophon-corner-tl" aria-hidden="true" />
        <span className="colophon-corner colophon-corner-tr" aria-hidden="true" />
        <span className="rib-flood" aria-hidden="true" />
        <span className="rib-scan" aria-hidden="true" />
        <p className="rib-ghost" aria-hidden="true">
          {t('folio')}
        </p>
        <div className="rib-night-inner">
          <p className={`board-kicker gold ${kicker}`}>
            {t('house')} · {t('folio')}
          </p>
          <h1 className="board-headline">{t('headline')}</h1>
          <p className="board-standfirst">{t('standfirst')}</p>
          <div className="board-led">
            {tally.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="rib-engine">
            <span className="board-engine-flag">{t('engine_off')}</span>
            <p>{t('engine_body')}</p>
          </div>
          {me ? (
            <p className="board-place-copy">
              {onBoard ? (
                <>
                  {t('place_rank')}
                  <strong> #{myIndex + 1}</strong>
                  <span>
                    · {me._count.predictions} {t('col_slips')} · {me.points} {t('col_points')}
                  </span>
                </>
              ) : (
                t('place_none')
              )}
            </p>
          ) : null}
        </div>
      </section>

      <div className="rib-sheet">
        <span className="colophon-corner colophon-corner-tl" aria-hidden="true" />
        <span className="colophon-corner colophon-corner-tr" aria-hidden="true" />
        <span className="colophon-corner colophon-corner-bl" aria-hidden="true" />
        <span className="colophon-corner colophon-corner-br" aria-hidden="true" />

        <blockquote className="rib-quote">
          <p>{t('quote')}</p>
        </blockquote>

        <section id="mood" className="rib-mood">
          <p className={`board-kicker ink ${kicker}`}>{t('mood_kicker')}</p>
          <h2 className="board-section-title">{t('mood_title')}</h2>
          <div className="board-mood">
            {mood.map((item) => (
              <div key={item.key}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <i className="board-mood-track" aria-hidden="true">
                  <i
                    className="board-mood-fill"
                    style={{ width: moodTotal ? `${Math.round((item.value / moodTotal) * 100)}%` : '0%' }}
                  />
                </i>
              </div>
            ))}
          </div>
        </section>

        <section id="programme">
          <p className={`board-kicker ink ${kicker}`}>{t('prog_kicker')}</p>
          <h2 className="board-section-title">{t('prog_title')}</h2>
          {openMatches.length === 0 ? (
            <p className="board-note">{t('prog_empty')}</p>
          ) : (
            <ul className="board-prog">
              {openMatches.map((match) => {
                const mine = myByMatch.get(match.id);
                return (
                  <li key={match.id}>
                    <Link href={`/match/${match.id}`} className="board-prog-card">
                      <div className="board-prog-meta">
                        <span>{match.league.name}</span>
                        <ClientTime value={match.kickoffAt} className="font-mono text-[11px] text-primary" />
                      </div>
                      <div className="board-prog-sides">
                        <strong>
                          {match.homeTeam.logoUrl ? <img src={match.homeTeam.logoUrl} alt="" /> : null}
                          {match.homeTeam.name}
                        </strong>
                        <em>✕</em>
                        <strong>
                          {match.awayTeam.logoUrl ? <img src={match.awayTeam.logoUrl} alt="" /> : null}
                          {match.awayTeam.name}
                        </strong>
                      </div>
                      <div className="board-prog-foot">
                        <span>
                          {match._count.predictions} {t('prog_slips')}
                        </span>
                        {mine ? <span className="is-mine">{t('prog_yours')}</span> : <span>{t('prog_open')}</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="board">
          <p className={`board-kicker ink ${kicker}`}>{t('list_kicker')}</p>
          <h2 className="board-section-title">{t('list_title')}</h2>
          {ranked.length === 0 ? (
            <div className="board-empty">
              <h3>{t('empty_title')}</h3>
              <p>{t('empty_body')}</p>
              <div className="board-empty-actions">
                <Link href="/matches" className="board-cta">
                  {t('empty_cta')}
                </Link>
                {!session ? (
                  <Link href="/login" className="board-cta ghost">
                    {t('login_cta')}
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="board-table-wrap">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>{t('col_rank')}</th>
                    <th>{t('col_name')}</th>
                    <th>{t('col_slips')}</th>
                    <th>{t('col_points')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row, index) => (
                    <tr key={row.id} className={row.id === me?.id ? 'is-you' : undefined}>
                      <td className="board-rank">{String(index + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="board-name">
                          <span className="board-avatar sm" aria-hidden="true">
                            {row.image ? <img src={row.image} alt="" /> : initials(row.name)}
                          </span>
                          <span>
                            {row.name || t('unnamed')}
                            {row.id === me?.id ? <em> · {t('you')}</em> : null}
                          </span>
                        </div>
                      </td>
                      <td className="tabular-nums">{row._count.predictions}</td>
                      <td className="tabular-nums board-pts">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {podium.length > 0 ? (
          <section className="board-podium">
            {podium.map((row, index) => (
              <article key={row.id} className={`board-podium-card is-${index + 1}`}>
                <span className="board-podium-rank">0{index + 1}</span>
                <div className="board-avatar" aria-hidden="true">
                  {row.image ? <img src={row.image} alt="" /> : initials(row.name)}
                </div>
                <h3>{row.name || t('unnamed')}</h3>
                <p>
                  {row.points} {t('col_points')} · {row._count.predictions} {t('col_slips')}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        <ol className="rib-rules">
          {rules.map((rule) => (
            <li key={rule.no}>
              <span>{rule.no}</span>
              <strong>{rule.title}</strong>
              <p>{rule.body}</p>
            </li>
          ))}
        </ol>
        {hasSlip ? null : session ? <p className="board-note">{t('place_none')}</p> : null}
        <div className="rib-doors">
          <Link href="/matches" className="board-cta">
            {t('door_matches')}
          </Link>
          <Link href="/terms#play" className="board-cta ghost">
            {t('door_terms')}
          </Link>
        </div>
        <p className="rib-colo">
          {t('house')} · {t('folio')} · {t('colo')}
        </p>
      </div>
    </article>
  );
}
