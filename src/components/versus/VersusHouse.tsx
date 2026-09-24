import { swallow } from '@/lib/ops/caught';
import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { localizeEntityMap } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { getLocale, getTranslations } from 'next-intl/server';
import { VersusPair } from './VersusPair';
import { QuickDerbyBar } from './QuickDerbyBar';
import { CrestImage } from '@/components/common/CrestImage';
import { DERBY_NEEDLES, recordFor, remapMatchSides, shareBar, versusHref, type VersusTeamOption } from './versus';
import type { DerbyLink } from './QuickDerbyBar';


const TEAM_SELECT = { id: true, slug: true, name: true, logoUrl: true, externalId: true } as const;

async function findDeskTeam(slug?: string) {
  if (!slug) return null;
  const exact = await prisma.team.findUnique({ where: { slug }, select: TEAM_SELECT });
  if (exact) return exact;
  return prisma.team.findFirst({
    where: { slug: { startsWith: `${slug}-` } },
    select: TEAM_SELECT,
  });
}

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

export async function VersusHouse({ team1, team2 }: { team1?: string; team2?: string }) {
  const t = await getTranslations('versus');
  const locale = await getLocale();
  const slugA = team1?.trim();
  const slugB = team2?.trim();

  const derbyNeedles = [...new Set(DERBY_NEEDLES.flatMap((row) => [row.a, row.b]))];
  const [leftFound, rightFound, derbyPool, teamCount] = await Promise.all([
    findDeskTeam(slugA).catch(swallow('VersusHouse.left', null)),
    findDeskTeam(slugB).catch(swallow('VersusHouse.right', null)),
    prisma.team
      .findMany({
        where: { OR: derbyNeedles.map((name) => ({ name: { contains: name, mode: 'insensitive' as const } })) },
        select: TEAM_SELECT,
        take: 40,
      })
      .catch(swallow('VersusHouse.derbies', [] as Array<{ id: string; slug: string; name: string; logoUrl: string | null; externalId: string }>)),
    prisma.team.count().catch(swallow('VersusHouse.count', 0)),
  ]);

  const left = leftFound ?? undefined;
  const right = rightFound ?? undefined;
  const missing = Boolean((slugA && !left) || (slugB && !right));

  const names = await localizeEntityMap(
    [left, right].filter(Boolean).map((row) => ({ entityType: 'TEAM' as const, entityId: row!.id, fallback: row!.name })),
    locale,
  );

  const asOption = (row: { id: string; slug: string; name: string; logoUrl: string | null }): VersusTeamOption => ({
    id: row.id,
    slug: row.slug,
    name: nameOf(names, row.id, row.name),
    logoUrl: row.logoUrl,
  });

  const pickClub = (needle: string) => {
    const n = needle.toLowerCase();
    return derbyPool.find(
      (row) => row.name.toLowerCase().includes(n) && !/\b(women|wfc|u1[5-9]|u2[0-3]|ii)\b/i.test(row.name),
    );
  };
  const derbyItems: DerbyLink[] = DERBY_NEEDLES.flatMap((derby) => {
    const a = pickClub(derby.a);
    const b = pickClub(derby.b);
    if (!a || !b) return [];
    return [
      {
        key: derby.key,
        label: locale === 'ar' ? derby.nameAr : derby.nameEn,
        href: versusHref(a.slug, b.slug),
        tag: derby.tag,
        active:
          (left?.slug === a.slug && right?.slug === b.slug) ||
          (left?.slug === b.slug && right?.slug === a.slug),
      },
    ];
  });

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

  // Try real API H2H when both teams have externalIds
  const leftExtId = left?.externalId;
  const rightExtId = right?.externalId;

  const [apiH2H, dbScaleResult] = await Promise.all([
    leftExtId && rightExtId && left && right && left.id !== right.id
      ? sportsData.getH2H(leftExtId, rightExtId).catch(swallow("src/components/versus/VersusHouse.tsx:104", []))
      : Promise.resolve([]),
    h2hWhere && left && right
      ? Promise.all([
        finishedGoals(left.id),
        finishedGoals(right.id),
        prisma.playerTeam.count({ where: { teamId: left.id, to: null } }).catch(swallow("src/components/versus/VersusHouse.tsx:110", 0)),
        prisma.playerTeam.count({ where: { teamId: right.id, to: null } }).catch(swallow("src/components/versus/VersusHouse.tsx:111", 0)),
        prisma.match.findMany({
          where: h2hWhere,
          select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
        }).catch(swallow("src/components/versus/VersusHouse.tsx:115", [])),
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
        }).catch(swallow("src/components/versus/VersusHouse.tsx:129", [])),
        prisma.team.findUnique({
          where: { id: left.id },
          select: { founded: true, venue: { select: { name: true } } },
        }).catch(swallow("src/components/versus/VersusHouse.tsx:133", null)),
        prisma.team.findUnique({
          where: { id: right.id },
          select: { founded: true, venue: { select: { name: true } } },
        }).catch(swallow("src/components/versus/VersusHouse.tsx:137", null)),
        lastFinished(left.id).catch(swallow("src/components/versus/VersusHouse.tsx:138", null)),
        lastFinished(right.id).catch(swallow("src/components/versus/VersusHouse.tsx:139", null)),
        prisma.standing.findMany({
          where: { teamId: left.id },
          select: { leagueId: true, league: { select: { name: true, slug: true } } },
        }).catch(swallow("src/components/versus/VersusHouse.tsx:143", [])),
        prisma.standing.findMany({
          where: { teamId: right.id },
          select: { leagueId: true, league: { select: { name: true, slug: true } } },
        }).catch(swallow("src/components/versus/VersusHouse.tsx:147", [])),
      ])
      : Promise.resolve(null),
  ]);

  const scale = h2hWhere && left && right && dbScaleResult
    ? (() => {
      const [leftGoals, rightGoals, leftSquad, rightSquad, h2hAll, dbH2hRecent, leftFull, rightFull, leftLast, rightLast, leftTables, rightTables] = dbScaleResult;
      const rightLeagues = new Set((rightTables as any[]).map((row) => row.leagueId));
      const seen = new Set<string>();
      const shared: Array<{ name: string; slug: string }> = [];
      for (const row of leftTables as any[]) {
        if (!rightLeagues.has(row.leagueId) || seen.has(row.leagueId)) continue;
        seen.add(row.leagueId);
        shared.push(row.league);
      }
      // If API returned H2H matches, use those for recent list + record calculation
      const useApiH2H = apiH2H.length > 0;
      const idMap = new Map(
        [
          left.externalId ? ([left.externalId, left.id] as const) : null,
          right.externalId ? ([right.externalId, right.id] as const) : null,
        ].filter(Boolean) as Array<[string, string]>,
      );
      const h2hForRecord = useApiH2H
        ? apiH2H.filter((m) => m.status === 'FINISHED').map((m) =>
          remapMatchSides(
            {
              homeTeamId: m.homeTeam.id,
              awayTeamId: m.awayTeam.id,
              homeScore: m.homeScore ?? null,
              awayScore: m.awayScore ?? null,
            },
            idMap,
          ),
        )
        : (h2hAll as Array<{
          homeTeamId: string;
          awayTeamId: string;
          homeScore: number | null;
          awayScore: number | null;
        }>);
      const h2hRecent = useApiH2H
        ? apiH2H.filter((m) => m.status === 'FINISHED').slice(0, 8).map((m) => ({
          id: m.externalId || m.id,
          kickoffAt: m.kickoffAt,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          homeTeam: {
            id: idMap.get(m.homeTeam.id) || m.homeTeam.id,
            name: m.homeTeam.name,
            slug: m.homeTeam.slug,
            logoUrl: m.homeTeam.logoUrl,
          },
          awayTeam: {
            id: idMap.get(m.awayTeam.id) || m.awayTeam.id,
            name: m.awayTeam.name,
            slug: m.awayTeam.slug,
            logoUrl: m.awayTeam.logoUrl,
          },
          league: { name: m.league.name },
        }))
        : dbH2hRecent;
      return {
        leftGoals,
        rightGoals,
        leftSquad: leftSquad as number,
        rightSquad: rightSquad as number,
        recA: recordFor(h2hForRecord, left.id),
        recB: recordFor(h2hForRecord, right.id),
        h2hRecent,
        leftFull,
        rightFull,
        leftLast,
        rightLast,
        shared,
      };
    })()
    : null;

  const paired = Boolean(scale && left && right);
  const leftName = left ? nameOf(names, left.id, left.name) : '';
  const rightName = right ? nameOf(names, right.id, right.name) : '';

  const meetingIds = (scale?.h2hRecent || []).map((row) => String(row.id));
  const localMeetings =
    meetingIds.length > 0
      ? await prisma.match
        .findMany({
          where: { OR: [{ id: { in: meetingIds } }, { externalId: { in: meetingIds } }] },
          select: { id: true, externalId: true },
        })
        .catch(swallow('VersusHouse.meetings', [] as Array<{ id: string; externalId: string }>))
      : [];
  const localByExt = new Map(localMeetings.flatMap((row) => [[row.id, row.id] as const, [row.externalId, row.id] as const]));

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  return (
    <div className="versus-house relative min-h-screen overflow-hidden pb-16">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-cyan-500/15 via-primary/10 to-transparent blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pt-8">
        <QuickDerbyBar items={derbyItems} locale={locale} />

        {/* ——— Epic Head-to-Head Clash Masthead ——— */}
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5 mb-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {t('house')} · {t('folio')}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                HEAD TO HEAD ARENA
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {teamCount} {locale === 'en' ? 'teams in the ledger' : 'فريق في الدفتر'}
            </span>
          </div>

          {/* Clash Stage */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-11 md:items-center">
            {/* Team A (Left) */}
            <div className="md:col-span-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-card/50 to-card/20 p-6 text-center backdrop-blur-md">
              {left ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/15 p-2">
                    <CrestImage src={left.logoUrl} name={leftName} size={72} className="h-full w-full object-contain" />
                  </div>
                  <h2 className="truncate text-xl font-black sm:text-2xl">{leftName}</h2>
                  {scale ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                      <span>
                        {scale.recA.won} {t('row_h2h_w')}
                      </span>
                      <span>·</span>
                      <span>
                        {scale.recA.drawn} {t('row_h2h_d')}
                      </span>
                      <span></span>
                      <span>
                        {scale.recA.lost} {t('row_h2h_l')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('pick_second')}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    {t('kaf_a')}
                  </span>
                  <p className="text-base font-bold text-muted-foreground">{t('seat_a')}</p>
                </div>
              )}
            </div>

            {/* Middle VS Beam */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 font-black text-black text-sm shadow-xl shadow-primary/20 animate-pulse">
                VS
              </div>
            </div>

            {/* Team B (Right) */}
            <div className="md:col-span-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/50 to-card/20 p-6 text-center backdrop-blur-md">
              {right ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 p-2">
                    <CrestImage src={right.logoUrl} name={rightName} size={72} className="h-full w-full object-contain" />
                  </div>
                  <h2 className="truncate text-xl font-black sm:text-2xl">{rightName}</h2>
                  {scale ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 font-mono text-xs font-bold text-amber-300">
                      <span>
                        {scale.recB.won} {t('row_h2h_w')}
                      </span>
                      <span>·</span>
                      <span>
                        {scale.recB.drawn} {t('row_h2h_d')}
                      </span>
                      <span>·</span>
                      <span>
                        {scale.recB.lost} {t('row_h2h_l')}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                    {t('kaf_b')}
                  </span>
                  <p className="text-base font-bold text-muted-foreground">{t('seat_b')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center space-y-2 max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {paired ? t('headline_pair', { a: leftName, b: rightName }) : t('headline')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('standfirst')}
            </p>
          </div>
        </header>

        {/* ——— Team Selector Pair ——— */}
        <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="border-b border-border pb-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('pair_kicker')}</p>
            <h2 className="text-lg sm:text-xl font-black text-foreground mt-1">{t('pair_title')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('pair_note')}</p>
          </div>

          {missing && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              {t('missing')}
            </div>
          )}

          <VersusPair locale={locale} initialA={left ? asOption(left) : null} initialB={right ? asOption(right) : null} />
        </section>

        {/* ——— Head-to-Head Power Sliders (When Paired) ——— */}
        {scale && left && right && (
          <>
            <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="border-b border-border pb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('scale_kicker')}</p>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">{t('scale_title')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('scale_note')}</p>
              </div>

              {/* Sliders Grid */}
              <div className="mx-auto max-w-3xl space-y-4">
                {[
                  { label: t('row_h2h_w'), a: scale.recA.won, b: scale.recB.won },
                  { label: t('row_goals'), a: scale.leftGoals.goals, b: scale.rightGoals.goals },
                  { label: t('row_played'), a: scale.leftGoals.matches, b: scale.rightGoals.matches },
                  {
                    label: t('row_gpm'),
                    a: scale.leftGoals.matches ? Number((scale.leftGoals.goals / scale.leftGoals.matches).toFixed(2)) : 0,
                    b: scale.rightGoals.matches ? Number((scale.rightGoals.goals / scale.rightGoals.matches).toFixed(2)) : 0,
                  },
                  { label: t('row_squad'), a: scale.leftSquad, b: scale.rightSquad },
                  { label: t('row_h2h_d'), a: scale.recA.drawn, b: scale.recB.drawn },
                ].map((row) => {
                  const bar = shareBar(row.a, row.b);
                  return (
                    <div key={row.label} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="font-mono text-sm text-cyan-400">{bar.empty ? '—' : row.a}</span>
                        <span className="uppercase tracking-wider text-muted-foreground">{row.label}</span>
                        <span className="font-mono text-sm text-amber-400">{bar.empty ? '—' : row.b}</span>
                      </div>
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          style={{ width: `${bar.pct}%` }}
                          className={`ys-grow-x h-full ${bar.empty ? 'bg-muted-foreground/30' : 'bg-cyan-500'}`}
                        />
                        <div
                          style={{ width: `${100 - bar.pct}%` }}
                          className={`ys-grow-x h-full ${bar.empty ? 'bg-muted-foreground/20' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
                {scale.recA.skipped > 0 ? (
                  <p className="text-center text-xs text-muted-foreground">{t('skipped', { n: String(scale.recA.skipped) })}</p>
                ) : null}
              </div>

              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                {[
                  { name: leftName, tint: 'text-cyan-400', full: scale.leftFull, last: scale.leftLast },
                  { name: rightName, tint: 'text-amber-400', full: scale.rightFull, last: scale.rightLast },
                ].map((club) => (
                  <div key={club.name} className="space-y-1 rounded-2xl border border-border bg-muted/50 p-4 text-xs">
                    <p className={`font-bold ${club.tint}`}>{club.name}</p>
                    <p className="text-muted-foreground">
                      {[club.full?.venue?.name, club.full?.founded ? `${t('founded')} ${club.full.founded}` : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                    {club.last ? (
                      <Link href={`/match/${club.last.id}`} className="block font-bold text-foreground">
                        {t('last_label')}: {club.last.homeTeam.name} {club.last.homeScore}–{club.last.awayScore} {club.last.awayTeam.name}
                      </Link>
                    ) : (
                      <p className="text-muted-foreground">{t('last_none')}</p>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">{t('shared_note')}</p>
                {scale.shared.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('shared_empty')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {scale.shared.map((league) => (
                      <Link
                        key={league.slug}
                        href={`/league/${league.slug}`}
                        className="rounded-full border border-border px-3 py-1 text-xs font-bold"
                      >
                        {league.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Meetings H2H Log */}
            <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="border-b border-border pb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('meet_kicker')}</p>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mt-1">{t('meet_title')}</h2>
              </div>

              {scale.h2hRecent.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t('meet_empty')}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {scale.h2hRecent.map((row) => {
                    const home = nameOf(names, row.homeTeam.id, row.homeTeam.name);
                    const away = nameOf(names, row.awayTeam.id, row.awayTeam.name);
                    const hasScore = row.homeScore != null && row.awayScore != null;
                    const href = localByExt.get(String(row.id));
                    const body = (
                      <>
                        <div className="mb-2 flex items-center justify-between border-b border-border pb-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{row.league.name}</span>
                          <ClientTime value={row.kickoffAt} className="font-mono" />
                        </div>
                        <div className="py-2 text-center">
                          <p className="text-xs font-bold leading-snug">{home}</p>
                          <span className="my-1 inline-block font-mono text-sm font-black text-primary">
                            {hasScore ? `${row.homeScore} – ${row.awayScore}` : '—'}
                          </span>
                          <p className="text-xs font-bold leading-snug">{away}</p>
                        </div>
                      </>
                    );
                    return href ? (
                      <Link key={row.id} href={`/match/${href}`} className="flex flex-col justify-between rounded-2xl border border-border bg-card/40 p-4">
                        {body}
                      </Link>
                    ) : (
                      <div key={row.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card/40 p-4">
                        {body}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Rules & Footer */}
        <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule) => (
              <div key={rule.no} className="rounded-2xl border border-border bg-card p-4">
                <span className="font-mono text-xs font-bold text-primary">{rule.no}</span>
                <h3 className="text-xs font-bold text-foreground mt-1.5 mb-1">{rule.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex flex-wrap gap-2">
              <Link href="/matches" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">
                {t('door_matches')}
              </Link>
              <Link href="/leagues" className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40">
                {t('door_leagues')}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {t('house')} · {t('folio')} · {locale.toUpperCase()}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
