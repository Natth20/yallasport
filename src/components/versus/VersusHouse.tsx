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
import { Flame, Scale, Swords, TrendingUp, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DERBY_NEEDLES, recordFor, remapMatchSides, shareBar, versusHref, type VersusTeamOption } from './versus';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { ComparisonGroupCard, type ComparisonCategory } from '@/components/common/ComparisonIndicators';
import { VersusShowcase } from './VersusShowcase';
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
          select: {
            founded: true,
            coach: { select: { name: true, slug: true } },
            venue: { select: { name: true, city: true, capacity: true } },
          },
        }).catch(swallow("VersusHouse.leftFull", null)),
        prisma.team.findUnique({
          where: { id: right.id },
          select: {
            founded: true,
            coach: { select: { name: true, slug: true } },
            venue: { select: { name: true, city: true, capacity: true } },
          },
        }).catch(swallow("VersusHouse.rightFull", null)),
        lastFinished(left.id).catch(swallow("src/components/versus/VersusHouse.tsx:138", null)),
        lastFinished(right.id).catch(swallow("src/components/versus/VersusHouse.tsx:139", null)),
        lastFive(left.id).catch(swallow('VersusHouse.leftFive', [])),
        lastFive(right.id).catch(swallow('VersusHouse.rightFive', [])),
        prisma.standing.findMany({
          where: { teamId: left.id },
          orderBy: [{ seasonId: 'desc' }, { played: 'desc' }],
          select: {
            rank: true,
            points: true,
            played: true,
            won: true,
            drawn: true,
            lost: true,
            goalsFor: true,
            goalsAgainst: true,
            seasonId: true,
            leagueId: true,
            league: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        }).catch(swallow("VersusHouse.leftStandings", [])),
        prisma.standing.findMany({
          where: { teamId: right.id },
          orderBy: [{ seasonId: 'desc' }, { played: 'desc' }],
          select: {
            rank: true,
            points: true,
            played: true,
            won: true,
            drawn: true,
            lost: true,
            goalsFor: true,
            goalsAgainst: true,
            seasonId: true,
            leagueId: true,
            league: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        }).catch(swallow("VersusHouse.rightStandings", [])),
      ])
      : Promise.resolve(null),
  ]);

  const scale = h2hWhere && left && right && dbScaleResult
    ? (() => {
      const [leftGoals, rightGoals, leftSquad, rightSquad, h2hAll, dbH2hRecent, leftFull, rightFull, leftLast, rightLast, leftFive, rightFive, leftTables, rightTables] = dbScaleResult;
      const leftStandingsList = (leftTables as any[]) || [];
      const rightStandingsList = (rightTables as any[]) || [];
      const rightLeagues = new Set(rightStandingsList.map((row) => row.leagueId));
      const seen = new Set<string>();
      const shared: Array<{ name: string; slug: string }> = [];
      for (const row of leftStandingsList) {
        if (!rightLeagues.has(row.leagueId) || seen.has(row.leagueId)) continue;
        seen.add(row.leagueId);
        shared.push(row.league);
      }

      // Best standing matching shared league, or domestic league with most games
      const sharedLeagueId = leftStandingsList.find((l) =>
        rightStandingsList.some((r) => r.leagueId === l.leagueId),
      )?.leagueId;

      const standA =
        leftStandingsList.find((t) => (sharedLeagueId ? t.leagueId === sharedLeagueId : true)) ||
        leftStandingsList[0] ||
        null;
      const standB =
        rightStandingsList.find((t) => (sharedLeagueId ? t.leagueId === sharedLeagueId : true)) ||
        rightStandingsList[0] ||
        null;

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
            logoUrl: m.homeTeam.logoUrl ?? null,
          },
          awayTeam: {
            id: idMap.get(m.awayTeam.id) || m.awayTeam.id,
            name: m.awayTeam.name,
            slug: m.awayTeam.slug,
            logoUrl: m.awayTeam.logoUrl ?? null,
          },
          league: { name: m.league.name },
        }))
        : dbH2hRecent;

      // H2H Goals
      let h2hGoalsA = 0;
      let h2hGoalsB = 0;
      for (const m of h2hForRecord) {
        if (m.homeScore != null && m.awayScore != null) {
          if (m.homeTeamId === left.id) {
            h2hGoalsA += m.homeScore;
            h2hGoalsB += m.awayScore;
          } else if (m.awayTeamId === left.id) {
            h2hGoalsA += m.awayScore;
            h2hGoalsB += m.homeScore;
          }
        }
      }

      // Recent Form stats (last 5 matches)
      const formStats = (matches: any[], teamId: string) => {
        let pts = 0;
        let gf = 0;
        let ga = 0;
        let clean = 0;
        let w = 0;
        let d = 0;
        let l = 0;
        for (const m of matches) {
          const home = m.homeTeamId === teamId;
          const scored = home ? m.homeScore : m.awayScore;
          const conceded = home ? m.awayScore : m.homeScore;
          if (scored != null && conceded != null) {
            gf += scored;
            ga += conceded;
            if (conceded === 0) clean += 1;
            if (scored > conceded) {
              pts += 3;
              w += 1;
            } else if (scored === conceded) {
              pts += 1;
              d += 1;
            } else {
              l += 1;
            }
          }
        }
        return { pts, gf, ga, clean, w, d, l, played: matches.length };
      };

      const formA = formStats(leftFive as any[], left.id);
      const formB = formStats(rightFive as any[], right.id);

      return {
        standA,
        standB,
        h2hGoalsA,
        h2hGoalsB,
        formA,
        formB,
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
      {paired && scale && left && right ? (
        <VersusShowcase
          locale={locale}
          left={left}
          right={right}
          scale={scale}
          derbyItems={derbyItems}
          localByExt={Object.fromEntries(localByExt)}
        />
      ) : (
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
                  <p className={styles.note}>{t('pick_second')}</p>
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
          </section>

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
      )}
    </SalonStage>
  );
}
