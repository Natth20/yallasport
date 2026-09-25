import React from 'react';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { PlayerDossierData, PlayerSeasonBlock, PlayerSeasonTotals } from '@/lib/players/load-dossier';
import { EntityBody, EntityBrand, EntityFrame, EntityHero } from '@/components/entity/EntityFrame';

function eventLabel(type: string, locale: string) {
  switch (type) {
    case 'GOAL':
      return pick(locale, 'هدف', 'Goal');
    case 'PENALTY':
      return pick(locale, 'ركلة جزاء', 'Penalty');
    case 'OWN_GOAL':
      return pick(locale, 'هدف عكسي', 'Own goal');
    case 'YELLOW_CARD':
      return pick(locale, 'بطاقة صفراء', 'Yellow');
    case 'RED_CARD':
      return pick(locale, 'بطاقة حمراء', 'Red');
    case 'SUBSTITUTION':
      return pick(locale, 'تبديل', 'Sub');
    default:
      return type;
  }
}

function metricGroups(block: PlayerSeasonBlock, locale: string) {
  const attack = [
    block.goals.total != null ? { label: pick(locale, 'أهداف', 'Goals'), value: block.goals.total } : null,
    block.goals.assists != null ? { label: pick(locale, 'صناعات', 'Assists'), value: block.goals.assists } : null,
    block.shots.total != null ? { label: pick(locale, 'تسديدات', 'Shots'), value: block.shots.total } : null,
    block.shots.on != null ? { label: pick(locale, 'على المرمى', 'On target'), value: block.shots.on } : null,
    block.penalty.scored != null ? { label: pick(locale, 'جزاء مسجّل', 'Pens scored'), value: block.penalty.scored } : null,
    block.penalty.missed != null ? { label: pick(locale, 'جزاء ضائع', 'Pens missed'), value: block.penalty.missed } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const creation = [
    block.passes.total != null ? { label: pick(locale, 'تمريرات', 'Passes'), value: block.passes.total } : null,
    block.passes.key != null ? { label: pick(locale, 'حاسمة', 'Key'), value: block.passes.key } : null,
    block.passes.accuracy != null ? { label: pick(locale, 'دقة %', 'Acc %'), value: block.passes.accuracy } : null,
    block.dribbles.attempts != null ? { label: pick(locale, 'محاولة مراوغة', 'Dribble att.'), value: block.dribbles.attempts } : null,
    block.dribbles.success != null ? { label: pick(locale, 'مراوغة ناجحة', 'Dribbles'), value: block.dribbles.success } : null,
    block.fouls.drawn != null ? { label: pick(locale, 'أخطاء مكتسبة', 'Fouls won'), value: block.fouls.drawn } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const defensive = [
    block.tackles.total != null ? { label: pick(locale, 'قطع', 'Tackles'), value: block.tackles.total } : null,
    block.tackles.blocks != null ? { label: pick(locale, 'تشتيت', 'Blocks'), value: block.tackles.blocks } : null,
    block.tackles.interceptions != null ? { label: pick(locale, 'اعتراض', 'Intercept'), value: block.tackles.interceptions } : null,
    block.duels.total != null ? { label: pick(locale, 'ثنائيات', 'Duels'), value: block.duels.total } : null,
    block.duels.won != null ? { label: pick(locale, 'ثنائيات فائزة', 'Duels won'), value: block.duels.won } : null,
    block.fouls.committed != null ? { label: pick(locale, 'أخطاء', 'Fouls'), value: block.fouls.committed } : null,
    block.cards.yellow != null ? { label: pick(locale, 'صفراء', 'Yellow'), value: block.cards.yellow } : null,
    block.cards.yellowRed != null ? { label: pick(locale, 'صفراء ثانية', 'Second yellow'), value: block.cards.yellowRed } : null,
    block.cards.red != null ? { label: pick(locale, 'حمراء', 'Red'), value: block.cards.red } : null,
    block.goals.saves != null ? { label: pick(locale, 'تصديات', 'Saves'), value: block.goals.saves } : null,
    block.goals.conceded != null ? { label: pick(locale, 'مستقبلة', 'Conceded'), value: block.goals.conceded } : null,
    block.penalty.saved != null ? { label: pick(locale, 'جزاء صدّ', 'Pens saved'), value: block.penalty.saved } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const workload = [
    block.games.appearances != null ? { label: pick(locale, 'ظهور', 'Apps'), value: block.games.appearances } : null,
    block.games.lineups != null ? { label: pick(locale, 'أساسي', 'XI'), value: block.games.lineups } : null,
    block.games.minutes != null ? { label: pick(locale, 'دقيقة', 'Mins'), value: block.games.minutes } : null,
    block.substitutes.in != null ? { label: pick(locale, 'دخول', 'Sub in'), value: block.substitutes.in } : null,
    block.substitutes.out != null ? { label: pick(locale, 'خروج', 'Sub out'), value: block.substitutes.out } : null,
    block.substitutes.bench != null ? { label: pick(locale, 'دكة', 'Bench'), value: block.substitutes.bench } : null,
    block.games.rating ? { label: pick(locale, 'تقييم', 'Rating'), value: block.games.rating } : null,
    block.games.captain ? { label: pick(locale, 'قائد', 'Captain'), value: pick(locale, 'نعم', 'Yes') } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return [
    { title: pick(locale, 'الهجوم', 'Attack'), rows: attack },
    { title: pick(locale, 'البناء', 'Creation'), rows: creation },
    { title: pick(locale, 'الدفاع', 'Defending'), rows: defensive },
    { title: pick(locale, 'الحمل', 'Workload'), rows: workload },
  ].filter((group) => group.rows.length > 0);
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <header className="psheet-head">
      <h2>{title}</h2>
      {note ? <p>{note}</p> : null}
    </header>
  );
}

function SeasonCard({ block, locale }: { block: PlayerSeasonBlock; locale: string }) {
  const groups = metricGroups(block, locale);
  if (groups.length === 0) return null;
  const league = localizePlainName(locale, block.league.name);
  const team = localizePlainName(locale, block.team.name);
  const position = block.games.position ? localizePlainName(locale, block.games.position) : null;
  return (
    <article className="psheet-comp">
      <div className="psheet-comp-top">
        <LeagueCrest name={block.league.name} logoUrl={block.league.logoUrl} className="h-9 w-9" />
        <div>
          <strong>{league}</strong>
          <em>{[team, block.league.country ? localizePlainName(locale, block.league.country) : null, block.league.season, position].filter(Boolean).join(' · ')}</em>
        </div>
      </div>
      <div className="psheet-comp-groups">
        {groups.map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.rows.map((row) => (
                <li key={row.label}>
                  <b>{row.value}</b>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

function dateLabel(value: Date, locale: string, withDay = false) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    day: withDay ? 'numeric' : undefined,
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function cell(value: string | number | null | undefined) {
  if (value == null || value === '') return '—';
  return value;
}

function vsMetrics(locale: string, totals: PlayerSeasonTotals) {
  return [
    { label: pick(locale, 'ظهور', 'Apps'), value: totals.appearances },
    { label: pick(locale, 'أساسي', 'Starts'), value: totals.lineups },
    { label: pick(locale, 'دقائق', 'Minutes'), value: totals.minutes },
    { label: pick(locale, 'دخول', 'Sub in'), value: totals.subsIn },
    { label: pick(locale, 'خروج', 'Sub out'), value: totals.subsOut },
    { label: pick(locale, 'دكة', 'Bench'), value: totals.bench },
    { label: pick(locale, 'أهداف', 'Goals'), value: totals.goals },
    { label: pick(locale, 'صناعات', 'Assists'), value: totals.assists },
    { label: pick(locale, 'تسديدات', 'Shots'), value: totals.shots },
    { label: pick(locale, 'على المرمى', 'On target'), value: totals.shotsOn },
    { label: pick(locale, 'جزاء مسجّل', 'Pens scored'), value: totals.penaltiesScored },
    { label: pick(locale, 'جزاء ضائع', 'Pens missed'), value: totals.penaltiesMissed },
    { label: pick(locale, 'تمريرات', 'Passes'), value: totals.passes },
    { label: pick(locale, 'حاسمة', 'Key passes'), value: totals.keyPasses },
    { label: pick(locale, 'دقة تمرير', 'Pass %'), value: totals.passAccuracy },
    { label: pick(locale, 'قطع', 'Tackles'), value: totals.tackles },
    { label: pick(locale, 'تشتيت', 'Blocks'), value: totals.blocks },
    { label: pick(locale, 'اعتراض', 'Intercept'), value: totals.interceptions },
    { label: pick(locale, 'ثنائيات', 'Duels'), value: totals.duels },
    { label: pick(locale, 'ثنائيات فائزة', 'Duels won'), value: totals.duelsWon },
    { label: pick(locale, 'مراوغات', 'Dribbles'), value: totals.dribbles },
    { label: pick(locale, 'محاولة مراوغة', 'Dribble att.'), value: totals.dribbleAttempts },
    { label: pick(locale, 'أخطاء مكتسبة', 'Fouls won'), value: totals.foulsDrawn },
    { label: pick(locale, 'أخطاء مرتكبة', 'Fouls'), value: totals.foulsCommitted },
    { label: pick(locale, 'صفراء', 'Yellow'), value: totals.yellow },
    { label: pick(locale, 'صفراء ثانية', 'Second yellow'), value: totals.yellowRed },
    { label: pick(locale, 'حمراء', 'Red'), value: totals.red },
    { label: pick(locale, 'تصديات', 'Saves'), value: totals.saves },
    { label: pick(locale, 'أهداف مستقبلة', 'Conceded'), value: totals.conceded },
    { label: pick(locale, 'تقييم', 'Rating'), value: totals.rating },
  ];
}

export function PlayerDossier({
  locale,
  dossier,
}: {
  locale: string;
  now: Date;
  dossier: PlayerDossierData;
}) {
  const {
    player,
    currentClub,
    clubHistory,
    apiClubs,
    seasonBlocks,
    seasonLabel,
    seasonTotals,
    prevSeasonTotals,
    olderSeasonTotals,
    rates,
    profileBars,
    trophies,
    sidelined,
    timeline,
    transfers,
    news,
  } = dossier;

  const name = localizePlainName(locale, player.name);
  const shirtNumber = currentClub?.shirtNumber ?? seasonBlocks.find((b) => b.games.number != null)?.games.number;
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ');
  const clubsRail = clubHistory.length > 0 ? clubHistory : null;
  const position = player.position ? localizePlainName(locale, player.position) : null;
  const clubName = currentClub ? localizePlainName(locale, currentClub.name) : null;
  const columns = [seasonTotals, prevSeasonTotals, olderSeasonTotals].filter(Boolean).length;

  const identity = [
    player.nationality
      ? { label: pick(locale, 'الجنسية', 'Nationality'), value: localizePlainName(locale, player.nationality) }
      : null,
    player.age != null ? { label: pick(locale, 'العمر', 'Age'), value: `${player.age}` } : null,
    player.birthDate
      ? {
        label: pick(locale, 'الميلاد', 'Born'),
        value: new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(player.birthDate)),
      }
      : null,
    player.birthPlace || player.birthCountry
      ? {
        label: pick(locale, 'مكان الميلاد', 'Birthplace'),
        value: [player.birthCountry, player.birthPlace]
          .filter(Boolean)
          .map((part) => localizePlainName(locale, part))
          .join(' · '),
      }
      : null,
    player.height ? { label: pick(locale, 'الطول', 'Height'), value: player.height } : null,
    player.weight ? { label: pick(locale, 'الوزن', 'Weight'), value: player.weight } : null,
    position ? { label: pick(locale, 'المركز', 'Position'), value: position } : null,
    shirtNumber != null ? { label: pick(locale, 'الرقم', 'No.'), value: `#${shirtNumber}` } : null,
    seasonBlocks.some((block) => block.games.captain)
      ? { label: pick(locale, 'القائد', 'Captain'), value: pick(locale, 'ظهر كقائد في المصدر', 'Listed as captain') }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  const kpis = (
    seasonTotals
      ? [
        { label: pick(locale, 'ظهور', 'Apps'), value: seasonTotals.appearances },
        { label: pick(locale, 'أساسي', 'Starts'), value: seasonTotals.lineups },
        { label: pick(locale, 'أهداف', 'Goals'), value: seasonTotals.goals },
        { label: pick(locale, 'صناعات', 'Assists'), value: seasonTotals.assists },
        { label: pick(locale, 'دقائق', 'Minutes'), value: seasonTotals.minutes },
        seasonTotals.rating ? { label: pick(locale, 'تقييم', 'Rating'), value: seasonTotals.rating } : null,
      ]
      : []
  ).filter(Boolean) as Array<{ label: string; value: string | number }>;

  const rateTiles = [
    rates?.goalsPer90 != null ? { label: pick(locale, 'هدف / 90', 'G/90'), value: rates.goalsPer90 } : null,
    rates?.assistsPer90 != null ? { label: pick(locale, 'صناعة / 90', 'A/90'), value: rates.assistsPer90 } : null,
    rates?.shotAccuracy != null ? { label: pick(locale, 'دقة تسديد', 'Shot %'), value: `${rates.shotAccuracy}%` } : null,
    rates?.duelWinPct != null ? { label: pick(locale, 'فوز ثنائيات', 'Duel %'), value: `${rates.duelWinPct}%` } : null,
    rates?.dribbleSuccessPct != null ? { label: pick(locale, 'نجاح مراوغة', 'Dribble %'), value: `${rates.dribbleSuccessPct}%` } : null,
    seasonTotals?.passAccuracy != null ? { label: pick(locale, 'دقة تمرير', 'Pass %'), value: `${seasonTotals.passAccuracy}%` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const vsBase = seasonTotals ? vsMetrics(locale, seasonTotals) : [];
  const vsPrev = prevSeasonTotals ? vsMetrics(locale, prevSeasonTotals) : [];
  const vsOlder = olderSeasonTotals ? vsMetrics(locale, olderSeasonTotals) : [];
  const vsRows = vsBase
    .map((row, index) => ({
      label: row.label,
      current: row.value,
      previous: vsPrev[index]?.value,
      older: vsOlder[index]?.value,
    }))
    .filter((row) => row.current != null || row.previous != null || row.older != null);

  const compsBySeason = seasonBlocks.reduce<Array<{ season: number | null; blocks: PlayerSeasonBlock[] }>>((acc, block) => {
    const last = acc[acc.length - 1];
    if (last && last.season === block.league.season) {
      last.blocks.push(block);
      return acc;
    }
    acc.push({ season: block.league.season, blocks: [block] });
    return acc;
  }, []);

  return (
    <EntityFrame tone="player">
    <div className="psheet">
      <div className="psheet-inner">
        <EntityHero>
        <section className="psheet-hero">
          <div className="psheet-photo">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt="" />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
            {shirtNumber != null ? <b>{shirtNumber}</b> : null}
          </div>
          <div className="psheet-intro">
            <EntityBrand kicker={pick(locale, 'بطاقة اللاعب', 'Player card')} />
            <p className="psheet-kicker">
              {pick(locale, 'ملف اللاعب', 'Player')}
              {seasonLabel ? ` · ${seasonLabel}/${seasonLabel + 1}` : ''}
            </p>
            <h1>{name}</h1>
            {fullName && fullName !== player.name ? <p className="psheet-aka">{fullName}</p> : null}
            <div className="psheet-chips">
              {currentClub?.slug ? (
                <Link href={`/team/${currentClub.slug}`} className="psheet-chip">
                  <LeagueCrest name={currentClub.name} logoUrl={currentClub.logoUrl} className="h-5 w-5" />
                  {clubName}
                  {shirtNumber != null ? ` · #${shirtNumber}` : ''}
                </Link>
              ) : currentClub ? (
                <span className="psheet-chip">{clubName}</span>
              ) : null}
              {position ? <span className="psheet-chip">{position}</span> : null}
              {player.injured === true ? (
                <span className="psheet-chip is-alert">{pick(locale, 'مصاب', 'Injured')}</span>
              ) : player.injured === false ? (
                <span className="psheet-chip">{pick(locale, 'جاهز', 'Fit')}</span>
              ) : null}
            </div>
            <Link href={`/compare-players?p1=${player.slug}`} className="psheet-compare">
              {pick(locale, 'قارن هذا اللاعب', 'Compare this player')}
            </Link>
          </div>
          {identity.length > 0 ? (
            <dl className="psheet-facts psheet-hero-facts">
              {identity.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
        </EntityHero>

        <EntityBody>
        {kpis.length > 0 ? (
          <ul className="psheet-kpis" aria-label={pick(locale, 'أرقام الموسم من المصدر', 'Season figures from the source')}>
            {kpis.map((row) => (
              <li key={row.label}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="psheet-layout">
          <div className="psheet-main">
            {(profileBars.length > 0 || rateTiles.length > 0) && (
              <section className="psheet-split">
                {profileBars.length > 0 ? (
                  <div className="psheet-card">
                    <Head title={pick(locale, 'بصمة الموسم', 'Season imprint')} />
                    <div className="psheet-bars">
                      {profileBars.map((bar) => {
                        const pct = Math.max(6, Math.round((bar.value / bar.max) * 100));
                        return (
                          <div key={bar.key}>
                            <p>
                              <strong>{locale === 'ar' ? bar.labelAr : bar.labelEn}</strong>
                              <em>{bar.value}</em>
                            </p>
                            <i>
                              <b className="ys-grow-x" style={{ width: `${pct}%` }} />
                            </i>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {rateTiles.length > 0 ? (
                  <div className="psheet-card">
                    <Head title={pick(locale, 'معدلات المصدر', 'Source rates')} />
                    <ul className="psheet-rates">
                      {rateTiles.map((tile) => (
                        <li key={tile.label}>
                          <strong>{tile.value}</strong>
                          <span>{tile.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            )}

            {vsRows.length > 0 ? (
              <section>
                <Head title={pick(locale, 'مقارنة المواسم', 'Seasons compared')} />
                <div className={`psheet-table is-cols-${Math.max(2, columns + 1)}`}>
                  <div className="psheet-tr is-head">
                    <span>{pick(locale, 'المؤشر', 'Metric')}</span>
                    <strong>
                      {seasonTotals?.season != null
                        ? `${seasonTotals.season}/${seasonTotals.season + 1}`
                        : pick(locale, 'الحالي', 'Current')}
                    </strong>
                    {prevSeasonTotals ? (
                      <em>
                        {prevSeasonTotals.season != null
                          ? `${prevSeasonTotals.season}/${prevSeasonTotals.season + 1}`
                          : pick(locale, 'السابق', 'Previous')}
                      </em>
                    ) : null}
                    {olderSeasonTotals ? (
                      <i>
                        {olderSeasonTotals.season != null
                          ? `${olderSeasonTotals.season}/${olderSeasonTotals.season + 1}`
                          : pick(locale, 'أقدم', 'Older')}
                      </i>
                    ) : null}
                  </div>
                  {vsRows.map((row) => (
                    <div key={row.label} className="psheet-tr">
                      <span>{row.label}</span>
                      <strong>{cell(row.current)}</strong>
                      {prevSeasonTotals ? <em>{cell(row.previous)}</em> : null}
                      {olderSeasonTotals ? <i>{cell(row.older)}</i> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {compsBySeason.length > 0 ? (
              <section>
                <Head title={pick(locale, 'المسابقات', 'Competitions')} />
                <div className="psheet-comps">
                  {compsBySeason.map((group) => (
                    <div key={String(group.season)} className="psheet-season-pack">
                      {group.season != null ? (
                        <p className="psheet-season-label">
                          {pick(locale, 'موسم', 'Season')} {group.season}/{group.season + 1}
                        </p>
                      ) : null}
                      {group.blocks.map((block, index) => (
                        <SeasonCard
                          key={`${block.league.id}-${block.team.id}-${block.league.season}-${index}`}
                          block={block}
                          locale={locale}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {timeline.length > 0 ? (
              <section>
                <Head title={pick(locale, 'سجل المباريات', 'Match log')} />
                <ul className="psheet-log">
                  {timeline.map((row) => (
                    <li key={row.id}>
                      <Link href={`/match/${row.match.id}`}>
                        <span className={`psheet-tag is-${row.type.toLowerCase()}`}>{eventLabel(row.type, locale)}</span>
                        <strong>
                          {localizePlainName(locale, row.match.homeTeam.name)} {row.match.homeScore ?? '—'}–{row.match.awayScore ?? '—'}{' '}
                          {localizePlainName(locale, row.match.awayTeam.name)}
                        </strong>
                        <em>
                          {row.minute}
                          {row.extraMinute ? `+${row.extraMinute}` : ''}′
                          {row.detail ? ` · ${localizePlainName(locale, row.detail)}` : ''}
                          {row.assistName ? ` · ${localizePlainName(locale, row.assistName)}` : ''}
                          {' · '}
                          {localizePlainName(locale, row.match.league.name)}
                        </em>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="psheet-rail">
            {clubsRail ? (
              <section>
                <Head title={pick(locale, 'الأندية', 'Clubs')} />
                <ul className="psheet-people">
                  {clubsRail.map((club) => (
                    <li key={`${club.id}-${club.from?.toISOString() || 'now'}`}>
                      {club.slug ? (
                        <Link href={`/team/${club.slug}`}>
                          <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-7 w-7" />
                          <span>
                            <strong>{localizePlainName(locale, club.name)}</strong>
                            <em>
                              {club.shirtNumber != null ? `#${club.shirtNumber}` : ''}
                              {club.to == null ? ` · ${pick(locale, 'حالي', 'Current')}` : ''}
                            </em>
                          </span>
                        </Link>
                      ) : (
                        <span>
                          <strong>{localizePlainName(locale, club.name)}</strong>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : apiClubs.length > 0 ? (
              <section>
                <Head title={pick(locale, 'الأندية من المصدر', 'Clubs from the source')} />
                <ul className="psheet-people">
                  {apiClubs.map((club) => (
                    <li key={club.team.id || club.team.name}>
                      <span>
                        <LeagueCrest name={club.team.name} logoUrl={club.team.logoUrl} className="h-7 w-7" />
                        <span>
                          <strong>{localizePlainName(locale, club.team.name)}</strong>
                          <em>{club.seasons.slice(0, 8).join(' · ')}</em>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {transfers.length > 0 ? (
              <section>
                <Head title={pick(locale, 'الانتقالات', 'Transfers')} />
                <ul className="psheet-list">
                  {transfers.map((row) => (
                    <li key={row.id}>
                      <strong>
                        {[row.fromTeam, row.toTeam]
                          .filter(Boolean)
                          .map((team) => localizePlainName(locale, team))
                          .join(' → ') || pick(locale, 'انتقال', 'Transfer')}
                      </strong>
                      <em>
                        {[row.type ? localizePlainName(locale, row.type) : null, row.fee].filter(Boolean).join(' · ') || '—'}
                        {' · '}
                        {dateLabel(row.date, locale, true)}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {sidelined.length > 0 ? (
              <section>
                <Head title={pick(locale, 'الغيابات', 'Absences')} />
                <ul className="psheet-list">
                  {sidelined.map((row, index) => (
                    <li key={`${row.type}-${row.start}-${index}`}>
                      <strong>{localizePlainName(locale, row.type)}</strong>
                      <em>{[row.start, row.end].filter(Boolean).join(' → ') || '—'}</em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {trophies.length > 0 ? (
              <section>
                <Head title={pick(locale, 'الألقاب', 'Honours')} />
                <ul className="psheet-honours">
                  {trophies.map((trophy, index) => (
                    <li key={`${trophy.league}-${trophy.season}-${index}`}>
                      <strong>{localizePlainName(locale, trophy.league)}</strong>
                      <em>
                        {[
                          trophy.season,
                          trophy.place ? localizePlainName(locale, trophy.place) : null,
                          trophy.country ? localizePlainName(locale, trophy.country) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {news.length > 0 ? (
              <section>
                <Head title={pick(locale, 'تقارير مرتبطة', 'Linked reports')} />
                <ul className="psheet-news">
                  {news.map((item) => (
                    <li key={item.id}>
                      <Link href={`/news/${item.slug}`}>
                        <strong>{item.shortTitle || item.title}</strong>
                        <em>
                          {item.category}
                          {item.sourceName ? ` · ${item.sourceName}` : ''}
                        </em>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
        </EntityBody>
      </div>
    </div>
    </EntityFrame>
  );
}
