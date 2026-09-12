import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { localizeEntityMap } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { getLocale, getTranslations } from 'next-intl/server';
import { VersusPair } from './VersusPair';
import { recordFor, type VersusTeamOption } from './versus';

async function finishedGoals(teamId: string) {
  const [home, away] = await Promise.all([
    prisma.match.aggregate({
      where: { status: 'FINISHED', homeTeamId: teamId },
      _sum: { homeScore: true },
      _count: { id: true },
    }),
    prisma.match.aggregate({
      where: { status: 'FINISHED', awayTeamId: teamId },
      _sum: { awayScore: true },
      _count: { id: true },
    }),
  ]);
  return {
    matches: home._count.id + away._count.id,
    goals: (home._sum.homeScore ?? 0) + (away._sum.awayScore ?? 0),
  };
}

function lastFinished(teamId: string) {
  return prisma.match.findFirst({
    where: {
      status: 'FINISHED',
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { kickoffAt: 'desc' },
    select: {
      id: true,
      kickoffAt: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      league: { select: { name: true } },
    },
  });
}

function nameOf(map: Map<string, string>, id: string, fallback: string) {
  return map.get(`TEAM:${id}`) || fallback;
}

function sharePct(a: number, b: number) {
  const total = a + b;
  if (total <= 0) return 50;
  return Math.round((a / total) * 100);
}

export async function VersusHouse({ team1, team2 }: { team1?: string; team2?: string }) {
  const t = await getTranslations('versus');
  const locale = await getLocale();
  const arabic = locale === 'ar';
  const kicker = arabic ? 'is-ar' : '';
  const slugA = team1?.trim();
  const slugB = team2?.trim();

  const deskTeams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    take: 500,
    select: { id: true, slug: true, name: true, logoUrl: true },
  });

  const names = await localizeEntityMap(
    deskTeams.map((row) => ({ entityType: 'TEAM', entityId: row.id, fallback: row.name })),
    locale
  );

  const options: VersusTeamOption[] = deskTeams.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: nameOf(names, row.id, row.name),
    logoUrl: row.logoUrl,
  }));

  const left = slugA ? deskTeams.find((row) => row.slug === slugA) : undefined;
  const right = slugB ? deskTeams.find((row) => row.slug === slugB) : undefined;
  const missing = Boolean((slugA && !left) || (slugB && !right));

  const h2hWhere =
    left && right && left.id !== right.id
      ? {
          status: 'FINISHED' as const,
          OR: [
            { homeTeamId: left.id, awayTeamId: right.id },
            { homeTeamId: right.id, awayTeamId: left.id },
          ],
        }
      : null;

  const scale = h2hWhere && left && right
    ? await Promise.all([
        finishedGoals(left.id),
        finishedGoals(right.id),
        prisma.playerTeam.count({ where: { teamId: left.id, to: null } }),
        prisma.playerTeam.count({ where: { teamId: right.id, to: null } }),
        prisma.match.findMany({
          where: h2hWhere,
          select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        }),
        prisma.match.findMany({
          where: h2hWhere,
          orderBy: { kickoffAt: 'desc' },
          take: 8,
          select: {
            id: true,
            kickoffAt: true,
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
            league: { select: { name: true } },
          },
        }),
        prisma.team.findUnique({
          where: { id: left.id },
          select: { founded: true, venue: { select: { name: true } } },
        }),
        prisma.team.findUnique({
          where: { id: right.id },
          select: { founded: true, venue: { select: { name: true } } },
        }),
        lastFinished(left.id),
        lastFinished(right.id),
        prisma.standing.findMany({
          where: { teamId: left.id },
          select: { leagueId: true, league: { select: { name: true, slug: true } } },
        }),
        prisma.standing.findMany({
          where: { teamId: right.id },
          select: { leagueId: true, league: { select: { name: true, slug: true } } },
        }),
      ]).then(([leftGoals, rightGoals, leftSquad, rightSquad, h2hAll, h2hRecent, leftFull, rightFull, leftLast, rightLast, leftTables, rightTables]) => {
        const rightLeagues = new Set(rightTables.map((row) => row.leagueId));
        const seen = new Set<string>();
        const shared: Array<{ name: string; slug: string }> = [];
        for (const row of leftTables) {
          if (!rightLeagues.has(row.leagueId) || seen.has(row.leagueId)) continue;
          seen.add(row.leagueId);
          shared.push(row.league);
        }
        return {
        leftGoals,
        rightGoals,
        leftSquad,
        rightSquad,
        recA: recordFor(h2hAll, left.id),
        recB: recordFor(h2hAll, right.id),
        h2hRecent,
        leftFull,
        rightFull,
        leftLast,
        rightLast,
        shared,
        };
      })
    : null;

  const paired = Boolean(scale && left && right);

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  const leftName = left ? nameOf(names, left.id, left.name) : '';
  const rightName = right ? nameOf(names, right.id, right.name) : '';

  return (
    <article className={`versus-house is-clash${paired ? ' is-paired' : ''}`}>
      <section className="clash-split">
        <div className="clash-pan is-a">
          {paired && left ? (
            <>
              {left.logoUrl ? <img src={left.logoUrl} alt="" /> : <span>{leftName.charAt(0)}</span>}
              <strong>{leftName}</strong>
              {scale ? (
                <em>
                  {scale.recA.won}–{scale.recA.drawn}–{scale.recA.lost}
                </em>
              ) : null}
            </>
          ) : (
            <>
              <span className="clash-empty">{t('kaf_a')}</span>
              <strong>{t('seat_a')}</strong>
            </>
          )}
        </div>
        <div className="clash-axis" aria-hidden="true">
          <b>×</b>
        </div>
        <div className="clash-pan is-b">
          {paired && right ? (
            <>
              {right.logoUrl ? <img src={right.logoUrl} alt="" /> : <span>{rightName.charAt(0)}</span>}
              <strong>{rightName}</strong>
              {scale ? (
                <em>
                  {scale.recB.won}–{scale.recB.drawn}–{scale.recB.lost}
                </em>
              ) : null}
            </>
          ) : (
            <>
              <span className="clash-empty">{t('kaf_b')}</span>
              <strong>{t('seat_b')}</strong>
            </>
          )}
        </div>
      </section>

      <header className="clash-mast">
        <p className={`versus-kicker ink ${kicker}`}>
          {t('house')} · {t('folio')}
        </p>
        <h1 className="versus-headline">
          {paired ? t('headline_pair', { a: leftName, b: rightName }) : t('headline')}
        </h1>
        <p className="versus-standfirst">{t('standfirst')}</p>
        {paired && scale && scale.recA.skipped > 0 ? (
          <p className="clash-skip">{t('skipped', { n: String(scale.recA.skipped) })}</p>
        ) : null}
      </header>

      <section id="pair" className="clash-clip">
        <p className={`versus-kicker ink ${kicker}`}>{t('pair_kicker')}</p>
        <h2 className="versus-section-title">{t('pair_title')}</h2>
        <p className="versus-note">{t('pair_note', { n: String(options.length) })}</p>
        {missing ? <p className="versus-warn">{t('missing')}</p> : null}
        <VersusPair teams={options} initialA={left?.slug} initialB={right?.slug} />
      </section>

        {scale && left && right ? (
          <>
            <section id="scale" className="clash-weigh">
              <p className={`versus-kicker gold ${kicker}`}>{t('scale_kicker')}</p>
              <h2 className="versus-section-title light">{t('scale_title')}</h2>
              <p className="versus-note">{t('scale_note')}</p>
              {[
                { label: t('row_squad'), a: scale.leftSquad, b: scale.rightSquad },
                { label: t('row_played'), a: scale.leftGoals.matches, b: scale.rightGoals.matches },
                { label: t('row_goals'), a: scale.leftGoals.goals, b: scale.rightGoals.goals },
                { label: t('row_h2h_w'), a: scale.recA.won, b: scale.recB.won },
                { label: t('row_h2h_d'), a: scale.recA.drawn, b: scale.recB.drawn },
              ].map((row) => (
                <div key={row.label} className="pst-stat">
                  <b>{row.a}</b>
                  <span>{row.label}</span>
                  <b>{row.b}</b>
                  <i aria-hidden="true">
                    <i style={{ width: `${sharePct(row.a, row.b)}%` }} />
                  </i>
                </div>
              ))}
              <div className="pst-bios">
                <p>
                  {[
                    scale.leftFull?.venue?.name,
                    scale.leftFull?.founded ? `${t('founded')} ${scale.leftFull.founded}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {scale.leftLast ? (
                    <>
                      {' · '}
                      <Link href={`/match/${scale.leftLast.id}`}>
                        {t('last_label')} {nameOf(names, scale.leftLast.homeTeam.id, scale.leftLast.homeTeam.name)}
                        {scale.leftLast.homeScore != null && scale.leftLast.awayScore != null
                          ? ` ${scale.leftLast.homeScore}–${scale.leftLast.awayScore} `
                          : ' — '}
                        {nameOf(names, scale.leftLast.awayTeam.id, scale.leftLast.awayTeam.name)}
                      </Link>
                    </>
                  ) : (
                    <> · {t('last_none')}</>
                  )}
                </p>
                <p>
                  {[
                    scale.rightFull?.venue?.name,
                    scale.rightFull?.founded ? `${t('founded')} ${scale.rightFull.founded}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  {scale.rightLast ? (
                    <>
                      {' · '}
                      <Link href={`/match/${scale.rightLast.id}`}>
                        {t('last_label')} {nameOf(names, scale.rightLast.homeTeam.id, scale.rightLast.homeTeam.name)}
                        {scale.rightLast.homeScore != null && scale.rightLast.awayScore != null
                          ? ` ${scale.rightLast.homeScore}–${scale.rightLast.awayScore} `
                          : ' — '}
                        {nameOf(names, scale.rightLast.awayTeam.id, scale.rightLast.awayTeam.name)}
                      </Link>
                    </>
                  ) : (
                    <> · {t('last_none')}</>
                  )}
                </p>
              </div>
              <p className="versus-note">{t('shared_note')}</p>
              {scale.shared.length === 0 ? (
                <p className="versus-note">{t('shared_empty')}</p>
              ) : (
                <div className="versus-shared">
                  {scale.shared.map((league) => (
                    <Link key={league.slug} href={`/league/${league.slug}`}>
                      {league.name}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section id="h2h" className="clash-meet">
              <p className={`versus-kicker ink ${kicker}`}>{t('meet_kicker')}</p>
              <h2 className="versus-section-title">{t('meet_title')}</h2>
              {scale.h2hRecent.length === 0 ? (
                <p className="versus-note">{t('meet_empty')}</p>
              ) : (
                <ul>
                  {scale.h2hRecent.map((row) => {
                    const home = nameOf(names, row.homeTeam.id, row.homeTeam.name);
                    const away = nameOf(names, row.awayTeam.id, row.awayTeam.name);
                    const hasScore = row.homeScore != null && row.awayScore != null;
                    return (
                      <li key={row.id}>
                        <Link href={`/match/${row.id}`}>
                          <span>{row.league.name}</span>
                          <strong>
                            {home}
                            {hasScore ? ` ${row.homeScore}–${row.awayScore} ` : ' — '}
                            {away}
                          </strong>
                          <ClientTime value={row.kickoffAt} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <p className="clash-protocol">
          {rules.map((rule) => (
            <span key={rule.no}>
              {rule.no} {rule.title}
            </span>
          ))}
        </p>
        <footer className="versus-colo clash-foot">
          <div>
            <Link href="/leagues" className="versus-cta ghost">
              {t('door_leagues')}
            </Link>
            <Link href="/search" className="versus-cta ghost">
              {t('door_search')}
            </Link>
            <Link href="/matches" className="versus-cta">
              {t('door_matches')}
            </Link>
          </div>
          <p>
            {t('house')} · {t('folio')} · {t('colo')}
          </p>
        </footer>
    </article>
  );
}

