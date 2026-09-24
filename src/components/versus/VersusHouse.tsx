import { ClientTime } from '@/components/datetime/ClientTime';
import { Link } from '@/i18n/navigation';
import { localizeEntityMap } from '@/lib/i18n/localized-content';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { getLocale, getTranslations } from 'next-intl/server';
import { VersusPair } from './VersusPair';
import { QuickDerbyBar } from './QuickDerbyBar';
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
  const slugA = team1?.trim();
  const slugB = team2?.trim();

  const deskTeams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    take: 500,
    select: { id: true, slug: true, name: true, logoUrl: true, externalId: true },
  }).catch(() => []);

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

  // Try real API H2H when both teams have externalIds
  const leftExtId = (left as any)?.externalId as string | null | undefined;
  const rightExtId = (right as any)?.externalId as string | null | undefined;

  const [apiH2H, dbScaleResult] = await Promise.all([
    leftExtId && rightExtId && left && right && left.id !== right.id
      ? sportsData.getH2H(leftExtId, rightExtId).catch(() => [])
      : Promise.resolve([]),
    h2hWhere && left && right
      ? Promise.all([
          finishedGoals(left.id),
          finishedGoals(right.id),
          prisma.playerTeam.count({ where: { teamId: left.id, to: null } }).catch(() => 0),
          prisma.playerTeam.count({ where: { teamId: right.id, to: null } }).catch(() => 0),
          prisma.match.findMany({
            where: h2hWhere,
            select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
          }).catch(() => []),
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
          }).catch(() => []),
          prisma.team.findUnique({
            where: { id: left.id },
            select: { founded: true, venue: { select: { name: true } } },
          }).catch(() => null),
          prisma.team.findUnique({
            where: { id: right.id },
            select: { founded: true, venue: { select: { name: true } } },
          }).catch(() => null),
          lastFinished(left.id).catch(() => null),
          lastFinished(right.id).catch(() => null),
          prisma.standing.findMany({
            where: { teamId: left.id },
            select: { leagueId: true, league: { select: { name: true, slug: true } } },
          }).catch(() => []),
          prisma.standing.findMany({
            where: { teamId: right.id },
            select: { leagueId: true, league: { select: { name: true, slug: true } } },
          }).catch(() => []),
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
        const h2hForRecord = useApiH2H
          ? apiH2H.filter((m) => m.status === 'FINISHED').map((m) => ({
              homeTeamId: m.homeTeam.id,
              awayTeamId: m.awayTeam.id,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
            }))
          : (h2hAll as any[]);
        const h2hRecent = useApiH2H
          ? apiH2H.filter((m) => m.status === 'FINISHED').slice(0, 8).map((m) => ({
              id: m.id,
              kickoffAt: m.kickoffAt,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, slug: m.homeTeam.slug, logoUrl: m.homeTeam.logoUrl },
              awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, slug: m.awayTeam.slug, logoUrl: m.awayTeam.logoUrl },
              league: { name: m.league.name },
            }))
          : (dbH2hRecent as any[]);
        return {
          leftGoals,
          rightGoals,
          leftSquad,
          rightSquad,
          recA: recordFor(h2hForRecord as any, useApiH2H ? left.id : left.id),
          recB: recordFor(h2hForRecord as any, useApiH2H ? right.id : right.id),
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

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-cyan-500/15 via-primary/10 to-transparent blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pt-8">
        <QuickDerbyBar currentTeam1={slugA} currentTeam2={slugB} locale={locale} />

        {/* ——— Epic Head-to-Head Clash Masthead ——— */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-8">
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
              {options.length} {locale === 'en' ? 'Teams Available' : 'فريق في الدفتر'}
            </span>
          </div>

          {/* Clash Stage */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-11 md:items-center">
            {/* Team A (Left) */}
            <div className="md:col-span-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-card/50 to-card/20 p-6 text-center backdrop-blur-md">
              {paired && left ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/40 p-2 shadow-lg shadow-cyan-500/10">
                    {left.logoUrl ? (
                      <img src={left.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-2xl font-black text-cyan-400">{leftName.charAt(0)}</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">{leftName}</h2>
                  {scale && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 font-mono text-xs font-bold text-cyan-300 border border-cyan-500/30">
                      <span>{scale.recA.won} {t('row_h2h_w')}</span>
                      <span>·</span>
                      <span>{scale.recA.drawn} {t('row_h2h_d')}</span>
                      <span>·</span>
                      <span>{scale.recA.lost} {locale === 'en' ? 'L' : 'خسارة'}</span>
                    </div>
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
              {paired && right ? (
                <div className="space-y-3">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/40 p-2 shadow-lg shadow-amber-500/10">
                    {right.logoUrl ? (
                      <img src={right.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-2xl font-black text-amber-400">{rightName.charAt(0)}</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white truncate">{rightName}</h2>
                  {scale && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 font-mono text-xs font-bold text-amber-300 border border-amber-500/30">
                      <span>{scale.recB.won} {t('row_h2h_w')}</span>
                      <span>·</span>
                      <span>{scale.recB.drawn} {t('row_h2h_d')}</span>
                      <span>·</span>
                      <span>{scale.recB.lost} {locale === 'en' ? 'L' : 'خسارة'}</span>
                    </div>
                  )}
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
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {paired ? t('headline_pair', { a: leftName, b: rightName }) : t('headline')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('standfirst')}
            </p>
          </div>
        </header>

        {/* ——— Team Selector Pair ——— */}
        <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="border-b border-white/10 pb-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('pair_kicker')}</p>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">{t('pair_title')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('pair_note', { n: String(options.length) })}</p>
          </div>

          {missing && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              {t('missing')}
            </div>
          )}

          <VersusPair teams={options} initialA={left?.slug} initialB={right?.slug} />
        </section>

        {/* ——— Head-to-Head Power Sliders (When Paired) ——— */}
        {scale && left && right && (
          <>
            <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('scale_kicker')}</p>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{t('scale_title')}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t('scale_note')}</p>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-4 max-w-3xl mx-auto">
                {[
                  { label: t('row_h2h_w'), a: scale.recA.won, b: scale.recB.won },
                  { label: t('row_goals'), a: scale.leftGoals.goals, b: scale.rightGoals.goals },
                  { label: t('row_played'), a: scale.leftGoals.matches, b: scale.rightGoals.matches },
                  { label: t('row_squad'), a: scale.leftSquad, b: scale.rightSquad },
                  { label: t('row_h2h_d'), a: scale.recA.drawn, b: scale.recB.drawn },
                ].map((row) => {
                  const pct = sharePct(row.a, row.b);
                  return (
                    <div key={row.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="font-mono text-sm text-cyan-400">{row.a}</span>
                        <span className="text-muted-foreground uppercase tracking-wider">{row.label}</span>
                        <span className="font-mono text-sm text-amber-400">{row.b}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5 flex">
                        <div style={{ width: `${pct}%` }} className="bg-cyan-500 h-full transition-all" />
                        <div style={{ width: `${100 - pct}%` }} className="bg-amber-500 h-full transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clubs Dossier */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-white/10">
                <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-xs space-y-1">
                  <p className="font-bold text-cyan-400">{leftName}</p>
                  <p className="text-muted-foreground">
                    {[scale.leftFull?.venue?.name, scale.leftFull?.founded ? `${t('founded')} ${scale.leftFull.founded}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-xs space-y-1">
                  <p className="font-bold text-amber-400">{rightName}</p>
                  <p className="text-muted-foreground">
                    {[scale.rightFull?.venue?.name, scale.rightFull?.founded ? `${t('founded')} ${scale.rightFull.founded}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            </section>

            {/* Recent Meetings H2H Log */}
            <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{t('meet_kicker')}</p>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{t('meet_title')}</h2>
              </div>

              {scale.h2hRecent.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t('meet_empty')}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {scale.h2hRecent.map((row) => {
                    const home = nameOf(names, row.homeTeam.id, row.homeTeam.name);
                    const away = nameOf(names, row.awayTeam.id, row.awayTeam.name);
                    const hasScore = row.homeScore != null && row.awayScore != null;
                    return (
                      <Link
                        key={row.id}
                        href={`/match/${row.id}`}
                        className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card/70"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{row.league.name}</span>
                          <ClientTime value={row.kickoffAt} className="font-mono" />
                        </div>
                        <div className="py-2 text-center">
                          <p className="text-xs font-bold text-white leading-snug">{home}</p>
                          <span className="my-1 inline-block font-mono text-sm font-black text-primary">
                            {hasScore ? `${row.homeScore} – ${row.awayScore}` : '—'}
                          </span>
                          <p className="text-xs font-bold text-white leading-snug">{away}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Rules & Footer */}
        <section className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule) => (
              <div key={rule.no} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <span className="font-mono text-xs font-bold text-primary">{rule.no}</span>
                <h3 className="text-xs font-bold text-white mt-1.5 mb-1">{rule.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link href="/matches" className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">
                {t('door_matches')}
              </Link>
              <Link href="/leagues" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/20">
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
