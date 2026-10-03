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
import { cache } from 'react';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { Badge } from '@/components/ui/Badge';
import { Scale, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DERBY_NEEDLES, recordFor, remapMatchSides, shareBar, versusHref, type VersusTeamOption } from './versus';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import type { DerbyLink } from './QuickDerbyBar';
import styles from './compare.module.css';


const TEAM_SELECT = { id: true, slug: true, name: true, logoUrl: true, externalId: true } as const;

const findDeskTeam = cache(async function findDeskTeam(slug?: string) {
  if (!slug) return null;
  const exact = await prisma.team.findUnique({ where: { slug }, select: TEAM_SELECT });
  if (exact) return exact;
  return prisma.team.findFirst({
    where: { slug: { startsWith: `${slug}-` } },
    select: TEAM_SELECT,
  });
});

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

function lastFive(teamId: string) {
  return prisma.match.findMany({
    where: {
      status: 'FINISHED',
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      homeScore: { not: null },
      awayScore: { not: null },
    },
    orderBy: { kickoffAt: 'desc' },
    take: 5,
    select: {
      id: true,
      kickoffAt: true,
      homeScore: true,
      awayScore: true,
      homeTeamId: true,
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      league: { select: { name: true } },
    },
  });
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
        lastFive(left.id).catch(swallow('VersusHouse.leftFive', [])),
        lastFive(right.id).catch(swallow('VersusHouse.rightFive', [])),
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
      const [leftGoals, rightGoals, leftSquad, rightSquad, h2hAll, dbH2hRecent, leftFull, rightFull, leftLast, rightLast, leftFive, rightFive, leftTables, rightTables] = dbScaleResult;
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
        leftFive,
        rightFive,
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
    <SalonStage
      tone="scale"
      wide
      compact
      kicker={t('house')}
      title={paired ? t('headline_pair', { a: leftName, b: rightName }) : t('headline')}
      lead={t('standfirst')}
      aside={locale === 'ar' ? `${teamCount} ناديًا` : `${teamCount} clubs`}
      tools={
        <HallFoyer
          label={t('folio')}
          items={[
            { href: '/compare', label: locale === 'en' ? 'Clubs' : 'الأندية', icon: Scale, current: true },
            { href: '/compare-players', label: locale === 'en' ? 'Players' : 'اللاعبون', icon: Users },
          ]}
        />
      }
    >
      <div className={styles.stack}>
        <QuickDerbyBar items={derbyItems} locale={locale} />

        <div className={styles.duel}>
          <Card variant="bordered" padding="md" className={styles.side}>
            {left ? (
              <>
                <Link href={`/team/${left.slug}`} className={styles.crest}>
                  <CrestImage src={left.logoUrl} name={leftName} size={72} className={styles.crestImg} />
                </Link>
                <Link href={`/team/${left.slug}`} className={styles.name}>
                  {leftName}
                </Link>
                {scale ? (
                  <Badge variant="accent" size="sm" className={styles.record}>
                    {scale.recA.won} {t('row_h2h_w')} · {scale.recA.drawn} {t('row_h2h_d')} · {scale.recA.lost} {t('row_h2h_l')}
                  </Badge>
                ) : (
                  <p className={styles.note}>{t('pick_second')}</p>
                )}
              </>
            ) : (
              <>
                <Badge variant="outline" size="sm">{t('kaf_a')}</Badge>
                <p className={styles.seat}>{t('seat_a')}</p>
              </>
            )}
          </Card>

          <span className={styles.vs} aria-hidden>VS</span>

          <Card variant="bordered" padding="md" className={styles.side}>
            {right ? (
              <>
                <Link href={`/team/${right.slug}`} className={styles.crest}>
                  <CrestImage src={right.logoUrl} name={rightName} size={72} className={styles.crestImg} />
                </Link>
                <Link href={`/team/${right.slug}`} className={styles.name}>
                  {rightName}
                </Link>
                {scale ? (
                  <Badge variant="outline" size="sm" className={styles.record}>
                    {scale.recB.won} {t('row_h2h_w')} · {scale.recB.drawn} {t('row_h2h_d')} · {scale.recB.lost} {t('row_h2h_l')}
                  </Badge>
                ) : null}
              </>
            ) : (
              <>
                <Badge variant="outline" size="sm">{t('kaf_b')}</Badge>
                <p className={styles.seat}>{t('seat_b')}</p>
              </>
            )}
          </Card>
        </div>

        <section>
          <div className={styles.head}>
            <p>{t('pair_kicker')}</p>
            <h2>{t('pair_title')}</h2>
            <p>{t('pair_note')}</p>
          </div>
          {missing ? <p className={styles.missing}>{t('missing')}</p> : null}
          <VersusPair locale={locale} initialA={left ? asOption(left) : null} initialB={right ? asOption(right) : null} />
          {left && right && left.id !== right.id ? (
            <p className={styles.note}>
              <Link href={versusHref(right.slug, left.slug)}>{t('swap')}</Link>
            </p>
          ) : null}
        </section>

        {scale && left && right ? (
          <Tabs defaultValue="scale" variant="underline">
            <TabsList aria-label={t('scale_title')}>
              <TabsTrigger value="scale">{t('scale_title')}</TabsTrigger>
              <TabsTrigger value="meet">{t('meet_title')}</TabsTrigger>
            </TabsList>

            <TabsContent value="scale">
              <div className={styles.stack}>
                <div className={styles.head}>
                  <p>{t('scale_kicker')}</p>
                  <p>{t('scale_note')}</p>
                </div>
                <div className={styles.meters}>
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
                      <Card key={row.label} variant="bordered" padding="sm" className={styles.meter}>
                        <div className={styles.meterHead}>
                          <span className={bar.empty ? styles.meterMuted : styles.meterA}>{bar.empty ? '—' : row.a}</span>
                          <span className={styles.meterLabel}>{row.label}</span>
                          <span className={bar.empty ? styles.meterMuted : styles.meterB}>{bar.empty ? '—' : row.b}</span>
                        </div>
                        <div className={styles.track}>
                          <span
                            className={bar.empty ? styles.fillEmpty : styles.fillA}
                            style={{ width: `${bar.pct}%` }}
                          />
                          <span
                            className={bar.empty ? styles.fillEmptySoft : styles.fillB}
                            style={{ width: `${100 - bar.pct}%` }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                  {scale.recA.skipped > 0 ? (
                    <p className={styles.note}>{t('skipped', { n: String(scale.recA.skipped) })}</p>
                  ) : null}
                </div>

                <div className={styles.facts}>
                  {[
                    { name: leftName, full: scale.leftFull, last: scale.leftLast },
                    { name: rightName, full: scale.rightFull, last: scale.rightLast },
                  ].map((club) => (
                    <Card key={club.name} variant="bordered" padding="sm" className={styles.fact}>
                      <strong>{club.name}</strong>
                      <p className={styles.meta}>
                        {[club.full?.venue?.name, club.full?.founded ? `${t('founded')} ${club.full.founded}` : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                      {club.last ? (
                        <Link href={`/match/${club.last.id}`}>
                          {t('last_label')}: {localizeTeamName(locale, club.last.homeTeam.name)} {club.last.homeScore}–{club.last.awayScore} {localizeTeamName(locale, club.last.awayTeam.name)}
                        </Link>
                      ) : (
                        <p className={styles.meta}>{t('last_none')}</p>
                      )}
                    </Card>
                  ))}
                </div>

                <div className={styles.facts}>
                  {[
                    { name: leftName, rows: scale.leftFive as Awaited<ReturnType<typeof lastFive>>, teamId: left.id },
                    { name: rightName, rows: scale.rightFive as Awaited<ReturnType<typeof lastFive>>, teamId: right.id },
                  ].map((club) => (
                    <Card key={`${club.name}-form`} variant="bordered" padding="sm" className={styles.fact}>
                      <strong>{club.name}</strong>
                      {club.rows.length === 0 ? (
                        <p className={styles.meta}>{t('last_none')}</p>
                      ) : (
                        <ul className={styles.meetings}>
                          {club.rows.map((row) => {
                            const home = row.homeTeamId === club.teamId;
                            const scored = home ? row.homeScore : row.awayScore;
                            const conceded = home ? row.awayScore : row.homeScore;
                            const mark = scored == null || conceded == null ? '—' : scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
                            const opp = home ? row.awayTeam.name : row.homeTeam.name;
                            return (
                              <li key={row.id}>
                                <Link href={`/match/${row.id}`}>
                                  {mark} · {localizeTeamName(locale, opp)} {row.homeScore}–{row.awayScore} · {row.league.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </Card>
                  ))}
                </div>

                <div className={styles.stack}>
                  <p className={styles.note}>{t('shared_note')}</p>
                  {scale.shared.length === 0 ? (
                    <p className={styles.note}>{t('shared_empty')}</p>
                  ) : (
                    <div className={styles.chips}>
                      {scale.shared.map((league) => (
                        <Link key={league.slug} href={`/league/${league.slug}`} className={styles.chip}>
                          {league.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meet">
              <div className={styles.stack}>
                <div className={styles.head}>
                  <p>{t('meet_kicker')}</p>
                </div>
                {scale.h2hRecent.length === 0 ? (
                  <p className={styles.note}>{t('meet_empty')}</p>
                ) : (
                  <div className={styles.meetings}>
                    {scale.h2hRecent.map((row) => {
                      const home = nameOf(names, row.homeTeam.id, row.homeTeam.name);
                      const away = nameOf(names, row.awayTeam.id, row.awayTeam.name);
                      const hasScore = row.homeScore != null && row.awayScore != null;
                      const href = localByExt.get(String(row.id));
                      const body = (
                        <>
                          <div className={styles.meetingTop}>
                            <span>{row.league.name}</span>
                            <ClientTime value={row.kickoffAt} />
                          </div>
                          <p className={styles.club}>{home}</p>
                          <p className={styles.score}>{hasScore ? `${row.homeScore} – ${row.awayScore}` : '—'}</p>
                          <p className={styles.club}>{away}</p>
                        </>
                      );
                      return href ? (
                        <Card key={row.id} variant="interactive" padding="sm">
                          <Link href={`/match/${href}`} className={styles.meeting}>
                            {body}
                          </Link>
                        </Card>
                      ) : (
                        <Card key={row.id} variant="bordered" padding="sm" className={styles.meeting}>
                          {body}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}

        <section>
          <div className={styles.rules}>
            {rules.map((rule) => (
              <Card key={rule.no} variant="bordered" padding="sm" className={styles.rule}>
                <b>{rule.no}</b>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </Card>
            ))}
          </div>
          <div className={styles.doors}>
            <div className={styles.doorRow}>
              <Link href="/matches" className={styles.chip}>{t('door_matches')}</Link>
              <Link href="/leagues" className={styles.chip}>{t('door_leagues')}</Link>
            </div>
            <p className={styles.note}>
              {t('house')} · {t('folio')} · {locale.toUpperCase()}
            </p>
          </div>
        </section>
      </div>
    </SalonStage>
  );
}
