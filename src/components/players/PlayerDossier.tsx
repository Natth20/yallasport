import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { DeskRule, EditionPlate, EndMark, PhotoCorners, StorySpine } from '@/components/news/NewsOrnaments';
import { pick } from '@/i18n/pick';
import type { PlayerDossierData, PlayerSeasonBlock, PlayerSeasonTotals } from '@/lib/players/load-dossier';

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
    block.penalty.scored != null ? { label: pick(locale, 'جزاء ناجح', 'Pens scored'), value: block.penalty.scored } : null,
    block.penalty.missed != null ? { label: pick(locale, 'جزاء ضائع', 'Pens missed'), value: block.penalty.missed } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const creation = [
    block.passes.total != null ? { label: pick(locale, 'تمريرات', 'Passes'), value: block.passes.total } : null,
    block.passes.key != null ? { label: pick(locale, 'حاسمة', 'Key'), value: block.passes.key } : null,
    block.passes.accuracy != null ? { label: pick(locale, 'دقة %', 'Acc %'), value: block.passes.accuracy } : null,
    block.dribbles.attempts != null
      ? { label: pick(locale, 'محاولات مراوغة', 'Dribble att.'), value: block.dribbles.attempts }
      : null,
    block.dribbles.success != null
      ? { label: pick(locale, 'مراوغة ناجحة', 'Dribbles'), value: block.dribbles.success }
      : null,
    block.fouls.drawn != null ? { label: pick(locale, 'أخطاء مكتسبة', 'Fouls won'), value: block.fouls.drawn } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const defensive = [
    block.tackles.total != null ? { label: pick(locale, 'قطع', 'Tackles'), value: block.tackles.total } : null,
    block.tackles.blocks != null ? { label: pick(locale, 'تصديات', 'Blocks'), value: block.tackles.blocks } : null,
    block.tackles.interceptions != null
      ? { label: pick(locale, 'اعتراض', 'Intercept'), value: block.tackles.interceptions }
      : null,
    block.duels.total != null ? { label: pick(locale, 'ثنائيات', 'Duels'), value: block.duels.total } : null,
    block.duels.won != null ? { label: pick(locale, 'ثنائيات فائزة', 'Duels won'), value: block.duels.won } : null,
    block.fouls.committed != null
      ? { label: pick(locale, 'أخطاء', 'Fouls'), value: block.fouls.committed }
      : null,
    block.cards.yellow != null ? { label: pick(locale, 'صفراء', 'Yellow'), value: block.cards.yellow } : null,
    block.cards.yellowRed != null
      ? { label: pick(locale, 'صفراء ثانية', '2nd yellow'), value: block.cards.yellowRed }
      : null,
    block.cards.red != null ? { label: pick(locale, 'حمراء', 'Red'), value: block.cards.red } : null,
    block.goals.saves != null ? { label: pick(locale, 'تصديات حارس', 'Saves'), value: block.goals.saves } : null,
    block.goals.conceded != null
      ? { label: pick(locale, 'أهداف مستقبلة', 'Conceded'), value: block.goals.conceded }
      : null,
    block.penalty.saved != null
      ? { label: pick(locale, 'جزاء صدّ', 'Pens saved'), value: block.penalty.saved }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const workload = [
    block.games.appearances != null ? { label: pick(locale, 'ظهور', 'Apps'), value: block.games.appearances } : null,
    block.games.lineups != null ? { label: pick(locale, 'أساسي', 'XI'), value: block.games.lineups } : null,
    block.games.minutes != null ? { label: pick(locale, 'دقيقة', 'Mins'), value: block.games.minutes } : null,
    block.substitutes.in != null ? { label: pick(locale, 'دخول', 'Sub in'), value: block.substitutes.in } : null,
    block.substitutes.out != null ? { label: pick(locale, 'خروج', 'Sub out'), value: block.substitutes.out } : null,
    block.substitutes.bench != null ? { label: pick(locale, 'دكة', 'Bench'), value: block.substitutes.bench } : null,
    block.games.rating ? { label: pick(locale, 'تقييم', 'Rating'), value: block.games.rating } : null,
    block.games.number != null ? { label: pick(locale, 'الرقم', 'No.'), value: block.games.number } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return [
    { title: pick(locale, 'الهجوم', 'Attack'), rows: attack },
    { title: pick(locale, 'البناء', 'Creation'), rows: creation },
    { title: pick(locale, 'الدفاع', 'Defending'), rows: defensive },
    { title: pick(locale, 'الحمل', 'Workload'), rows: workload },
  ].filter((group) => group.rows.length > 0);
}

function SeasonCard({
  block,
  locale,
  featured = false,
}: {
  block: PlayerSeasonBlock;
  locale: string;
  featured?: boolean;
}) {
  const groups = metricGroups(block, locale);
  if (groups.length === 0) return null;

  return (
    <article className={`player-season-card ${featured ? 'is-featured' : ''}`}>
      <div className="player-season-head">
        <div className="flex min-w-0 items-center gap-3">
          <LeagueCrest name={block.league.name} logoUrl={block.league.logoUrl} className="h-10 w-10" />
          <div className="min-w-0">
            <strong className="block truncate text-[1rem]">{block.league.name}</strong>
            <em className="mt-0.5 block truncate text-[10px] not-italic text-muted-foreground">
              {[block.team.name, block.league.season, block.league.country, block.games.position]
                .filter(Boolean)
                .join(' · ')}
            </em>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {featured ? (
            <span className="player-captain-chip">{pick(locale, 'أبرز مسابقة', 'Lead competition')}</span>
          ) : null}
          {block.games.captain ? (
            <span className="player-captain-chip">{pick(locale, 'قائد', 'Captain')}</span>
          ) : null}
          {block.league.season ? <span className="player-season-chip">{block.league.season}</span> : null}
        </div>
      </div>
      <div className="player-season-groups">
        {groups.map((group) => (
          <div key={group.title} className="player-season-group">
            <h4>{group.title}</h4>
            <div className="player-season-grid">
              {group.rows.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CompareCell({
  label,
  current,
  previous,
}: {
  label: string;
  current: string | number | null | undefined;
  previous: string | number | null | undefined;
}) {
  if (current == null && previous == null) return null;
  return (
    <div className="player-compare-cell">
      <span>{label}</span>
      <strong>{current ?? '—'}</strong>
      <em>{previous ?? '—'}</em>
    </div>
  );
}

function SectionHead({
  folio,
  kicker,
  title,
  note,
  aside,
}: {
  folio: string;
  kicker: string;
  title: string;
  note?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="player-section-head">
      <div className="player-section-copy">
        <div className="player-section-kicker-row">
          <span className="player-folio-mark" aria-hidden>
            {folio}
          </span>
          <span className="atlas-section-kicker">{kicker}</span>
        </div>
        <h2 className="player-section-title">{title}</h2>
        {note ? <p className="player-section-note">{note}</p> : null}
        <DeskRule className="mt-3 max-w-sm opacity-50" />
      </div>
      {aside ? <div className="player-section-aside">{aside}</div> : null}
    </div>
  );
}

function totalsBoard(totals: PlayerSeasonTotals, locale: string) {
  const rows: Array<{ label: string; value: string | number } | null> = [
    { label: pick(locale, 'ظهور', 'Apps'), value: totals.appearances },
    { label: pick(locale, 'أساسي', 'Starts'), value: totals.lineups },
    { label: pick(locale, 'دقائق', 'Mins'), value: totals.minutes },
    { label: pick(locale, 'أهداف', 'Goals'), value: totals.goals },
    { label: pick(locale, 'صناعات', 'Assists'), value: totals.assists },
    { label: pick(locale, 'تسديدات', 'Shots'), value: totals.shots },
    { label: pick(locale, 'على المرمى', 'On target'), value: totals.shotsOn },
    { label: pick(locale, 'تمريرات', 'Passes'), value: totals.passes },
    { label: pick(locale, 'حاسمة', 'Key'), value: totals.keyPasses },
    totals.passAccuracy != null
      ? { label: pick(locale, 'دقة تمرير', 'Pass %'), value: `${totals.passAccuracy}%` }
      : null,
    { label: pick(locale, 'قطع', 'Tackles'), value: totals.tackles },
    { label: pick(locale, 'إعاقات', 'Blocks'), value: totals.blocks },
    { label: pick(locale, 'اعتراض', 'Intercept'), value: totals.interceptions },
    { label: pick(locale, 'ثنائيات', 'Duels'), value: totals.duels },
    { label: pick(locale, 'ثنائيات فائزة', 'Duels won'), value: totals.duelsWon },
    { label: pick(locale, 'مراوغات', 'Dribbles'), value: totals.dribbles },
    { label: pick(locale, 'محاولات مراوغة', 'Dribble att.'), value: totals.dribbleAttempts },
    { label: pick(locale, 'أخطاء مكتسبة', 'Fouls won'), value: totals.foulsDrawn },
    { label: pick(locale, 'أخطاء', 'Fouls'), value: totals.foulsCommitted },
    { label: pick(locale, 'صفراء', 'Yellow'), value: totals.yellow },
    { label: pick(locale, 'صفراء ثانية', '2nd yellow'), value: totals.yellowRed },
    { label: pick(locale, 'حمراء', 'Red'), value: totals.red },
    { label: pick(locale, 'جزاء', 'Pens'), value: totals.penaltiesScored },
    { label: pick(locale, 'جزاء ضائع', 'Missed pens'), value: totals.penaltiesMissed },
    { label: pick(locale, 'دخول', 'Sub in'), value: totals.subsIn },
    { label: pick(locale, 'خروج', 'Sub out'), value: totals.subsOut },
    { label: pick(locale, 'دكة', 'Bench'), value: totals.bench },
    { label: pick(locale, 'تصديات', 'Saves'), value: totals.saves },
    { label: pick(locale, 'مستقبلة', 'Conceded'), value: totals.conceded },
    totals.rating ? { label: pick(locale, 'تقييم', 'Rating'), value: totals.rating } : null,
  ];
  return rows.filter((row): row is { label: string; value: string | number } => {
    if (!row) return false;
    return row.value !== 0 && row.value !== '0';
  });
}

export function PlayerDossier({
  locale,
  now,
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
    totals,
    seasonBlocks,
    seasonLabel,
    seasonTotals,
    prevSeasonTotals,
    rates,
    profileBars,
    trophies,
    sidelined,
    timeline,
    transfers,
    news,
  } = dossier;

  const editionLabel = player.position || pick(locale, 'لاعب', 'Player');
  const shirtNumber = currentClub?.shirtNumber ?? seasonBlocks.find((b) => b.games.number != null)?.games.number;

  const signature = [
    seasonTotals?.goals != null && seasonTotals.goals > 0
      ? { value: seasonTotals.goals, label: pick(locale, 'هدف', 'Goals'), tone: 'orange' as const }
      : totals.goals > 0
        ? { value: totals.goals, label: pick(locale, 'هدف', 'Goals'), tone: 'orange' as const }
        : null,
    seasonTotals?.assists != null && seasonTotals.assists > 0
      ? { value: seasonTotals.assists, label: pick(locale, 'صناعة', 'Assists'), tone: 'green' as const }
      : null,
    seasonTotals?.minutes
      ? { value: seasonTotals.minutes, label: pick(locale, 'دقيقة', 'Minutes'), tone: 'ink' as const }
      : null,
    seasonTotals?.appearances
      ? { value: seasonTotals.appearances, label: pick(locale, 'ظهور', 'Apps'), tone: 'ink' as const }
      : null,
    seasonTotals?.rating
      ? { value: seasonTotals.rating, label: pick(locale, 'تقييم', 'Rating'), tone: 'gold' as const }
      : null,
    rates?.goalsPer90 != null && rates.goalsPer90 > 0
      ? { value: rates.goalsPer90, label: pick(locale, 'هدف / 90', 'G/90'), tone: 'orange' as const }
      : null,
  ].filter(Boolean) as Array<{
    value: string | number;
    label: string;
    tone: 'ink' | 'orange' | 'green' | 'gold' | 'rose';
  }>;

  const identity = [
    player.nationality ? { label: pick(locale, 'الجنسية', 'Nationality'), value: player.nationality } : null,
    player.birthDate
      ? {
          label: pick(locale, 'تاريخ الميلاد', 'Born'),
          value: (
            <ClientTime
              value={player.birthDate}
              locale={locale}
              options={{ day: 'numeric', month: 'long', year: 'numeric' }}
            />
          ),
        }
      : null,
    player.birthPlace || player.birthCountry
      ? {
          label: pick(locale, 'مكان الميلاد', 'Birthplace'),
          value: [player.birthPlace, player.birthCountry].filter(Boolean).join(', '),
        }
      : null,
    player.age != null ? { label: pick(locale, 'العمر', 'Age'), value: `${player.age}` } : null,
    player.height ? { label: pick(locale, 'الطول', 'Height'), value: player.height } : null,
    player.weight ? { label: pick(locale, 'الوزن', 'Weight'), value: player.weight } : null,
    player.position ? { label: pick(locale, 'المركز', 'Position'), value: player.position } : null,
    shirtNumber != null ? { label: pick(locale, 'الرقم', 'Number'), value: `#${shirtNumber}` } : null,
    player.injured === true
      ? { label: pick(locale, 'الحالة', 'Status'), value: pick(locale, 'مصاب', 'Injured') }
      : player.injured === false
        ? { label: pick(locale, 'الحالة', 'Status'), value: pick(locale, 'جاهز', 'Available') }
        : null,
    currentClub ? { label: pick(locale, 'النادي', 'Club'), value: currentClub.name } : null,
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  const rateTiles = [
    rates?.goalsPer90 != null
      ? { label: pick(locale, 'هدف كل 90', 'Goals / 90'), value: rates.goalsPer90 }
      : null,
    rates?.assistsPer90 != null
      ? { label: pick(locale, 'صناعة كل 90', 'Assists / 90'), value: rates.assistsPer90 }
      : null,
    rates?.shotAccuracy != null
      ? { label: pick(locale, 'دقة التسديد', 'Shot accuracy'), value: `${rates.shotAccuracy}%` }
      : null,
    rates?.duelWinPct != null
      ? { label: pick(locale, 'فوز الثنائيات', 'Duel win %'), value: `${rates.duelWinPct}%` }
      : null,
    rates?.dribbleSuccessPct != null
      ? { label: pick(locale, 'نجاح المراوغة', 'Dribble %'), value: `${rates.dribbleSuccessPct}%` }
      : null,
    seasonTotals?.passAccuracy != null
      ? { label: pick(locale, 'دقة التمرير', 'Pass %'), value: `${seasonTotals.passAccuracy}%` }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const boardRows = seasonTotals ? totalsBoard(seasonTotals, locale) : [];
  const leadNews = news[0] || null;
  const moreNews = news.slice(1);
  const clubsRail = clubHistory.length > 0 ? clubHistory : null;
  const featuredBlock = seasonBlocks[0] || null;
  const otherBlocks = seasonBlocks.slice(1);

  return (
    <div className="player-dossier ys-dossier-stack">
      <span className="atlas-flood atlas-flood-a" aria-hidden />
      <span className="atlas-flood atlas-flood-b" aria-hidden />
      <span className="player-vignette" aria-hidden />

      <section className="player-hero">
        <span className="player-hero-grid" aria-hidden />
        <span className="player-hero-foil" aria-hidden />
        <PhotoCorners className="pointer-events-none absolute inset-4 opacity-35 sm:inset-6" />
        {player.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.photoUrl} alt="" className="player-hero-wash" aria-hidden />
        ) : null}
        {shirtNumber != null ? (
          <span className="player-hero-ghost-number" aria-hidden>
            {shirtNumber}
          </span>
        ) : null}

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8 lg:px-12">
          <div className="club-wire-bar mb-8">
            <span>{pick(locale, 'مكتب النتائج · ملف لاعب', 'Results desk · Player dossier')}</span>
            <span>
              YS · {seasonLabel || now.getFullYear()}
              {shirtNumber != null ? ` · #${shirtNumber}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <EditionPlate year={player.age ?? now.getFullYear()} label={editionLabel} />
            <div className="player-hero-actions">
              {currentClub?.slug ? (
                <Link href={`/team/${currentClub.slug}`} className="player-club-pill">
                  <LeagueCrest name={currentClub.name} logoUrl={currentClub.logoUrl} className="h-6 w-6" />
                  <span>{currentClub.name}</span>
                </Link>
              ) : null}
              <Link href={`/compare?player1=${player.slug}`} className="club-compare-link">
                {pick(locale, 'قارن', 'Compare')}
              </Link>
            </div>
          </div>

          <div className="player-mast mt-10">
            <div className="player-portrait-stage">
              <span className="player-portrait-glow" aria-hidden />
              <div className="player-portrait">
                <span className="player-portrait-ring" aria-hidden />
                {player.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={player.photoUrl} alt="" />
                ) : (
                  <span className="player-portrait-empty" aria-hidden>
                    {player.name.charAt(0)}
                  </span>
                )}
                {shirtNumber != null ? <span className="player-number-badge">{shirtNumber}</span> : null}
              </div>
              {(player.nationality || player.position) && (
                <div className="player-portrait-caption">
                  {player.nationality ? <span>{player.nationality}</span> : null}
                  {player.position ? <span>{player.position}</span> : null}
                </div>
              )}
            </div>

            <div className="player-mast-copy min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="atlas-section-kicker text-orange-400">
                  {pick(locale, 'ملف اللاعب', 'Player dossier')}
                </span>
                {player.injured === true ? (
                  <span className="club-country-chip is-alert">{pick(locale, 'مصاب', 'Injured')}</span>
                ) : player.injured === false ? (
                  <span className="club-country-chip">{pick(locale, 'جاهز', 'Fit')}</span>
                ) : null}
              </div>
              <h1 className="player-wordmark mt-3">{player.name}</h1>
              {(player.firstName || player.lastName) && (
                <p className="player-fullname">
                  {[player.firstName, player.lastName].filter(Boolean).join(' ')}
                </p>
              )}
              <div className="player-meta-row mt-6">
                {player.age != null ? (
                  <span>
                    {player.age} {pick(locale, 'سنة', 'yrs')}
                  </span>
                ) : null}
                {player.height ? <span>{player.height}</span> : null}
                {player.weight ? <span>{player.weight}</span> : null}
                {currentClub ? <span>{currentClub.name}</span> : null}
              </div>
            </div>
          </div>

          {signature.length > 0 ? (
            <div className="player-signature-rail mt-10">
              <div className="player-signature-rail-label">
                <span>{pick(locale, 'توقيع الموسم', 'Season signature')}</span>
                <DeskRule className="max-w-[8rem] opacity-40" />
              </div>
              <div className="player-signature">
                {signature.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`player-signature-tile tone-${stat.tone}${index === 0 ? ' is-lead' : ''}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl space-y-16 px-5 py-14 sm:px-8 lg:px-12">
        {(identity.length > 0 || profileBars.length > 0 || rateTiles.length > 0) && (
          <section className="player-overview club-rise">
            {identity.length > 0 ? (
              <div className="player-passport">
                <PhotoCorners className="pointer-events-none absolute inset-3 opacity-25" />
                <span className="player-passport-stamp" aria-hidden>
                  YS
                </span>
                <div className="player-section-kicker-row">
                  <span className="player-folio-mark is-light">01</span>
                  <span className="atlas-section-kicker text-orange-300">
                    {pick(locale, 'الهوية', 'Identity')}
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-orange-50">
                  {pick(locale, 'جواز اللاعب', 'Player passport')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="player-passport-grid">
                  {identity.map((row, index) => (
                    <div key={row.label} className={index === 0 ? 'is-featured' : undefined}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="player-overview-side">
              {profileBars.length > 0 ? (
                <div className="player-profile-plate">
                  <div className="player-section-kicker-row">
                    <span className="player-folio-mark">02</span>
                    <span className="atlas-section-kicker">{pick(locale, 'الملف الرقمي', 'Digital profile')}</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    {pick(locale, 'بصمة الموسم', 'Season imprint')}
                  </h2>
                  <DeskRule className="my-4 max-w-xs opacity-50" />
                  <div className="player-bars">
                    {profileBars.map((bar, index) => {
                      const pct = Math.max(8, Math.round((bar.value / bar.max) * 100));
                      return (
                        <div key={bar.key} className="player-bar-row" style={{ animationDelay: `${index * 60}ms` }}>
                          <div className="player-bar-label">
                            <strong>{locale === 'ar' ? bar.labelAr : bar.labelEn}</strong>
                            <em>{bar.value}</em>
                          </div>
                          <div className="player-bar-track">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {rateTiles.length > 0 ? (
                <div className="player-rate-plate">
                  <div className="player-section-kicker-row">
                    <span className="player-folio-mark">03</span>
                    <span className="atlas-section-kicker">{pick(locale, 'الكفاءة', 'Efficiency')}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold tracking-tight">
                    {pick(locale, 'معدلات محسوبة من المصدر', 'Rates from source totals')}
                  </h3>
                  <div className="player-rate-grid">
                    {rateTiles.map((tile) => (
                      <div key={tile.label}>
                        <strong>{tile.value}</strong>
                        <span>{tile.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {boardRows.length > 0 ? (
          <section className="player-board club-rise">
            <SectionHead
              folio="04"
              kicker={pick(locale, 'لوحة الموسم', 'Season board')}
              title={pick(locale, 'كل أرقام الموسم', 'Full season ledger')}
              note={pick(
                locale,
                'تجميع حقيقي لكل بطولات الموسم من API — تظهر فقط القيم المسجّلة.',
                'Real aggregate across season competitions from API — only recorded values shown.'
              )}
                            aside={seasonLabel ? <span className="player-season-chip">{seasonLabel}</span> : null}
            />
            <div className="player-board-lead">
              {boardRows.slice(0, 3).map((row) => (
                <div key={row.label} className="player-board-lead-cell">
                  <strong>{row.value}</strong>
                  <span>{row.label}</span>
                </div>
              ))}
            </div>
            {boardRows.length > 3 ? (
              <div className="player-board-grid mt-4">
                {boardRows.slice(3).map((row) => (
                  <div key={row.label} className="player-board-cell">
                    <strong>{row.value}</strong>
                    <span>{row.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {seasonTotals && prevSeasonTotals ? (
          <section className="player-compare club-rise">
            <SectionHead
              folio="05"
              kicker={pick(locale, 'المقارنة', 'Compare')}
              title={pick(locale, 'هذا الموسم مقابل السابق', 'This season vs previous')}
                          />
            <div className="player-compare-head">
              <span>{pick(locale, 'المؤشر', 'Metric')}</span>
              <strong>{seasonTotals.season ?? pick(locale, 'الحالي', 'Current')}</strong>
              <em>{prevSeasonTotals.season ?? pick(locale, 'السابق', 'Previous')}</em>
            </div>
            <div className="player-compare-grid">
              <CompareCell
                label={pick(locale, 'ظهور', 'Apps')}
                current={seasonTotals.appearances}
                previous={prevSeasonTotals.appearances}
              />
              <CompareCell
                label={pick(locale, 'دقائق', 'Minutes')}
                current={seasonTotals.minutes}
                previous={prevSeasonTotals.minutes}
              />
              <CompareCell
                label={pick(locale, 'أهداف', 'Goals')}
                current={seasonTotals.goals}
                previous={prevSeasonTotals.goals}
              />
              <CompareCell
                label={pick(locale, 'صناعات', 'Assists')}
                current={seasonTotals.assists}
                previous={prevSeasonTotals.assists}
              />
              <CompareCell
                label={pick(locale, 'على المرمى', 'Shots on')}
                current={seasonTotals.shotsOn}
                previous={prevSeasonTotals.shotsOn}
              />
              <CompareCell
                label={pick(locale, 'تمريرات حاسمة', 'Key passes')}
                current={seasonTotals.keyPasses}
                previous={prevSeasonTotals.keyPasses}
              />
              <CompareCell
                label={pick(locale, 'قطع', 'Tackles')}
                current={seasonTotals.tackles}
                previous={prevSeasonTotals.tackles}
              />
              <CompareCell
                label={pick(locale, 'تقييم', 'Rating')}
                current={seasonTotals.rating}
                previous={prevSeasonTotals.rating}
              />
            </div>
          </section>
        ) : null}

        {featuredBlock ? (
          <section className="club-rise">
            <SectionHead
              folio="06"
              kicker={pick(locale, 'الموسم', 'Season')}
              title={pick(locale, 'دفتر المسابقات', 'Competition ledger')}
              note={pick(
                locale,
                'كل حقول الإحصاء المتاحة من المصدر لكل بطولة — بلا تقديرات.',
                'Every available stat field from source per competition — no estimates.'
              )}
                          />
            <div className="player-season-stack">
              <SeasonCard block={featuredBlock} locale={locale} featured />
              {otherBlocks.map((block, index) => (
                <SeasonCard
                  key={`${block.league.id}-${block.team.id}-${block.league.season}-${index}`}
                  block={block}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        ) : null}

        {trophies.length > 0 ? (
          <section className="player-trophies club-rise">
            <SectionHead
              folio="07"
              kicker={pick(locale, 'الألقاب', 'Honours')}
              title={pick(locale, 'رف الجوائز', 'Trophy shelf')}
                          />
            <div className="player-trophy-rail">
              {trophies.map((trophy, index) => (
                <div key={`${trophy.league}-${trophy.season}-${index}`} className="player-trophy-card">
                  <span className="player-trophy-folio">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{trophy.league}</strong>
                  <em>{[trophy.season, trophy.place, trophy.country].filter(Boolean).join(' · ')}</em>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {timeline.length > 0 ? (
          <section className="player-timeline club-rise">
            <SectionHead
              folio="08"
              kicker={pick(locale, 'اللحظات', 'Moments')}
              title={pick(locale, 'سجل المباريات', 'Match log')}
                          />
            <div className="player-timeline-list">
              {timeline.map((row, index) => (
                <Link key={row.id} href={`/match/${row.match.id}`} className="player-timeline-row">
                  <StorySpine mark="YS" folio={String(index + 1).padStart(2, '0')} />
                  <div className="player-timeline-body">
                    <div className="player-timeline-meta">
                      <span className={`player-event-chip is-${row.type.toLowerCase()}`}>
                        {eventLabel(row.type, locale)}
                      </span>
                      <span>
                        {row.minute}
                        {row.extraMinute ? `+${row.extraMinute}` : ''}′
                      </span>
                      <span>{row.match.league.name}</span>
                    </div>
                    <strong>
                      {row.match.homeTeam.name} {row.match.homeScore ?? '–'}–{row.match.awayScore ?? '–'}{' '}
                      {row.match.awayTeam.name}
                    </strong>
                    {row.assistName || row.detail ? (
                      <em>
                        {[
                          row.assistName && `${pick(locale, 'صناعة', 'Assist')}: ${row.assistName}`,
                          row.detail,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </em>
                    ) : null}
                  </div>
                  <ClientTime
                    value={row.match.kickoffAt}
                    locale={locale}
                    options={{ day: 'numeric', month: 'short' }}
                    className="player-timeline-date"
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {(clubsRail || transfers.length > 0 || apiClubs.length > 0 || sidelined.length > 0) && (
          <section className="space-y-6">
            <SectionHead
              folio="09"
              kicker={pick(locale, 'المسار', 'Path')}
              title={pick(locale, 'مهنة اللاعب', 'Player career')}
                          />
            <div className="player-career-grid">
            {clubsRail ? (
              <div className="player-side-plate club-rise">
                <div className="player-section-kicker-row">
                  <span className="player-folio-mark">A</span>
                  <span className="atlas-section-kicker">{pick(locale, 'الأندية', 'Clubs')}</span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'مسار الأندية', 'Club path')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="space-y-3">
                  {clubsRail.map((club) =>
                    club.slug ? (
                      <Link
                        key={`${club.id}-${club.from?.toISOString() || 'now'}`}
                        href={`/team/${club.slug}`}
                        className="player-club-row"
                      >
                        <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-8 w-8" />
                        <div className="min-w-0">
                          <strong>{club.name}</strong>
                          <em>
                            {club.shirtNumber != null
                              ? `#${club.shirtNumber}`
                              : pick(locale, 'بدون رقم', 'No number')}
                            {club.to == null ? ` · ${pick(locale, 'حالي', 'Current')}` : ''}
                          </em>
                        </div>
                      </Link>
                    ) : null
                  )}
                </div>
              </div>
            ) : apiClubs.length > 0 ? (
              <div className="player-side-plate club-rise">
                <div className="player-section-kicker-row">
                  <span className="player-folio-mark">A</span>
                  <span className="atlas-section-kicker">{pick(locale, 'الأندية', 'Clubs')}</span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'مسار الأندية', 'Club path')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="space-y-3">
                  {apiClubs.map((club) => (
                    <div key={club.team.id || club.team.name} className="player-club-row">
                      <LeagueCrest name={club.team.name} logoUrl={club.team.logoUrl} className="h-8 w-8" />
                      <div className="min-w-0">
                        <strong>{club.team.name}</strong>
                        <em>
                          {club.seasons.length > 0
                            ? club.seasons.slice(0, 8).join(' · ')
                            : pick(locale, 'مواسم مسجّلة', 'Recorded seasons')}
                        </em>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {transfers.length > 0 ? (
              <div className="player-side-plate club-rise">
                <div className="player-section-kicker-row">
                  <span className="player-folio-mark">B</span>
                  <span className="atlas-section-kicker">{pick(locale, 'الانتقالات', 'Transfers')}</span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'سجل الانتقالات', 'Transfer history')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="space-y-3">
                  {transfers.map((row) => (
                    <div key={row.id} className="player-transfer-row">
                      <div>
                        <strong>
                          {[row.fromTeam, row.toTeam].filter(Boolean).join(' → ') ||
                            pick(locale, 'انتقال', 'Transfer')}
                        </strong>
                        <em>{[row.type, row.fee].filter(Boolean).join(' · ')}</em>
                      </div>
                      <ClientTime
                        value={row.date}
                        locale={locale}
                        options={{ month: 'short', year: 'numeric' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {sidelined.length > 0 ? (
              <div className="player-side-plate club-rise">
                <div className="player-section-kicker-row">
                  <span className="player-folio-mark">C</span>
                  <span className="atlas-section-kicker">{pick(locale, 'الغيابات', 'Absences')}</span>
                </div>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'سجل الإصابات', 'Sidelined log')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="space-y-3">
                  {sidelined.map((row, index) => (
                    <div key={`${row.type}-${row.start}-${index}`} className="player-transfer-row">
                      <div>
                        <strong>{row.type}</strong>
                        <em>
                          {[row.start, row.end].filter(Boolean).join(' → ') ||
                            pick(locale, 'فترة مسجّلة', 'Recorded spell')}
                        </em>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            </div>
          </section>
        )}

        {news.length > 0 ? (
          <section className="player-reports club-rise">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <SectionHead
                folio="10"
                kicker={pick(locale, 'من المكتب', 'From the desk')}
                title={pick(locale, 'تقارير مرتبطة', 'Linked reports')}
                              />
              <Link href="/news" className="club-reports-all">
                {pick(locale, 'كل التقارير', 'All reports')}
              </Link>
            </div>
            <div className="player-reports-grid">
              {leadNews ? (
                <Link href={`/news/${leadNews.slug}`} className="player-report-lead">
                  {leadNews.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leadNews.featuredImage} alt="" />
                  ) : (
                    <div className="is-empty" aria-hidden />
                  )}
                  <div>
                    <span>{leadNews.category}</span>
                    <h3>{leadNews.shortTitle || leadNews.title}</h3>
                    {leadNews.excerpt ? <p>{leadNews.excerpt}</p> : null}
                  </div>
                </Link>
              ) : null}
              {moreNews.map((item, index) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="player-report-card">
                  <StorySpine mark="YS" folio={String(index + 2).padStart(2, '0')} />
                  <div>
                    <span>{item.category}</span>
                    <h3>{item.shortTitle || item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
            <EndMark className="mt-8 opacity-60" />
          </section>
        ) : null}
      </div>
    </div>
  );
}
