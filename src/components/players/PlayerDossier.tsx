'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  Crosshair,
  Flame,
  Layers,
  Newspaper,
  Repeat,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { formatSportFigure } from '@/lib/format/sport-figure';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { PlayerDossierData, PlayerSeasonBlock } from '@/lib/players/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

function metricGroups(block: PlayerSeasonBlock, locale: string) {
  return [
    { label: pick(locale, 'ظهور', 'Apps'), value: block.games.appearances },
    { label: pick(locale, 'أساسي', 'XI'), value: block.games.lineups },
    { label: pick(locale, 'دقيقة', 'Mins'), value: block.games.minutes },
    { label: pick(locale, 'أهداف', 'Goals'), value: block.goals.total },
    { label: pick(locale, 'صناعات', 'Assists'), value: block.goals.assists },
    { label: pick(locale, 'تقييم', 'Rating'), value: formatSportFigure(block.games.rating) ?? block.games.rating },
    { label: pick(locale, 'صفراء', 'Yellow'), value: block.cards.yellow },
    { label: pick(locale, 'حمراء', 'Red'), value: block.cards.red },
  ].filter((row) => row.value != null) as Array<{ label: string; value: string | number }>;
}

export function PlayerDossier({
  locale,
  dossier,
}: {
  locale: string;
  dossier: PlayerDossierData;
}) {
  const {
    player,
    currentClub,
    clubHistory,
    apiClubs,
    seasonBlocks,
    seasonTotals,
    rates,
    profileBars,
    trophies,
    sidelined,
    timeline,
    transfers,
    news,
    teammates,
    clubFixtures,
  } = dossier;

  const name = localizePlainName(locale, player.name);
  const portrait = apiSportsPlayerPhoto(player.externalId, player.photoUrl);
  const shirt = currentClub?.shirtNumber ?? seasonBlocks.find((block) => block.games.number != null)?.games.number;
  const clubName = currentClub ? localizePlainName(locale, currentClub.name) : null;
  const queue = useMemo(() => teammates.slice(0, 10), [teammates]);
  const [face, setFace] = useState<string | null>(null);
  const shownShot = face || portrait;

  const identity = [
    player.nationality ? { label: pick(locale, 'الجنسية', 'Nationality'), value: localizePlainName(locale, player.nationality) } : null,
    player.age != null ? { label: pick(locale, 'العمر', 'Age'), value: `${player.age} ${pick(locale, 'سنة', 'yrs')}` } : null,
    player.height ? { label: pick(locale, 'الطول', 'Height'), value: player.height } : null,
    player.weight ? { label: pick(locale, 'الوزن', 'Weight'), value: player.weight } : null,
    player.position ? { label: pick(locale, 'المركز', 'Position'), value: localizePlainName(locale, player.position) } : null,
    shirt != null ? { label: pick(locale, 'رقم القميص', 'Shirt No.'), value: `#${shirt}` } : null,
    clubName ? { label: pick(locale, 'النادي الحالي', 'Current Club'), value: clubName } : null,
    player.injured ? { label: pick(locale, 'الحالة الطبية', 'Status'), value: pick(locale, 'مصاب حالياً', 'Injured') } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const kpis = seasonTotals
    ? [
      { label: pick(locale, 'مباريات الظهور', 'Appearances'), value: seasonTotals.appearances },
      { label: pick(locale, 'أساسي', 'Lineups / Starts'), value: seasonTotals.lineups },
      { label: pick(locale, 'الأهداف المسجلة', 'Total Goals'), value: seasonTotals.goals },
      { label: pick(locale, 'التمريرات الحاسمة', 'Assists'), value: seasonTotals.assists },
      { label: pick(locale, 'دقائق اللعب', 'Minutes Played'), value: seasonTotals.minutes },
      seasonTotals.rating
        ? { label: pick(locale, 'التقييم العام', 'Rating'), value: formatSportFigure(seasonTotals.rating) ?? seasonTotals.rating }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string | number }>
    : [];

  return (
    <div className={`${styles.hall} ${styles.cardHall}`}>
      {/* ---------------- FOYER SUB-NAVIGATION ---------------- */}
      <nav className={styles.foyer} aria-label={pick(locale, 'أقسام ملف اللاعب', 'Player profile sections')}>
        <div className={styles.foyerTabs}>
          <a href="#hall-screen" className={`${styles.foyerTab} ${styles.isOn}`}>
            <Flame size={14} aria-hidden />
            <span>{pick(locale, 'بطاقة اللاعب', 'Player VIP Card')}</span>
          </a>
          {kpis.length > 0 || profileBars.length > 0 ? (
            <a href="#hall-stats" className={styles.foyerTab}>
              <Activity size={14} aria-hidden />
              <span>{pick(locale, 'المؤشرات والمهارات', 'Key Metrics & Skills')}</span>
            </a>
          ) : null}
          {seasonBlocks.length > 0 ? (
            <a href="#hall-competitions" className={styles.foyerTab}>
              <Layers size={14} aria-hidden />
              <span>{pick(locale, 'المسابقات والبطولات', 'Competitions')}</span>
              <span className={styles.foyerBadge}>{seasonBlocks.length}</span>
            </a>
          ) : null}
          {clubFixtures.upcoming.length > 0 || clubFixtures.recent.length > 0 ? (
            <a href="#hall-fixtures" className={styles.foyerTab}>
              <Calendar size={14} aria-hidden />
              <span>{pick(locale, 'مواعيد النادي', 'Club Fixtures')}</span>
              <span className={styles.foyerBadge}>{clubFixtures.upcoming.length + clubFixtures.recent.length}</span>
            </a>
          ) : null}
          {teammates.length > 0 ? (
            <a href="#hall-squad" className={styles.foyerTab}>
              <Users size={14} aria-hidden />
              <span>{pick(locale, 'زملاء الفريق', 'Teammates')}</span>
              <span className={styles.foyerBadge}>{teammates.length}</span>
            </a>
          ) : null}
          {transfers.length > 0 || clubHistory.length > 0 ? (
            <a href="#hall-transfers" className={styles.foyerTab}>
              <Repeat size={14} aria-hidden />
              <span>{pick(locale, 'الانتقالات والأندية', 'Transfers & Clubs')}</span>
            </a>
          ) : null}
          {trophies.length > 0 ? (
            <a href="#hall-trophies" className={styles.foyerTab}>
              <Award size={14} aria-hidden />
              <span>{pick(locale, 'الألقاب والبطولات', 'Trophies')}</span>
              <span className={styles.foyerBadge}>{trophies.length}</span>
            </a>
          ) : null}
          {sidelined.length > 0 ? (
            <a href="#hall-medical" className={styles.foyerTab}>
              <AlertCircle size={14} aria-hidden />
              <span>{pick(locale, 'السجل الطبي', 'Medical Record')}</span>
            </a>
          ) : null}
        </div>
      </nav>

      {/* ---------------- CINEMA STAGE: VIP PLAYER CARD ---------------- */}
      <div id="hall-screen" className={styles.stage}>
        <section className={styles.screen} aria-label={name}>
          <div className={styles.frame}>
            <div className={styles.chassis}>
              <HallBezel
                label={clubName || pick(locale, 'ملف رياضي رسمي', 'Official Sports Profile')}
                clock={player.position ? localizePlainName(locale, player.position) : pick(locale, 'لاعب محترف', 'Professional Athlete')}
              />

              {/* VIP Ultimate Player Platform */}
              <div className={styles.vipCard}>
                {shirt != null ? (
                  <span className={styles.vipWatermark} aria-hidden>
                    {shirt}
                  </span>
                ) : null}

                <div className={styles.vipInfo}>
                  {currentClub ? (
                    <Link href={`/team/${currentClub.slug}`} className={styles.vipTeamBadge}>
                      <LeagueCrest name={currentClub.name} logoUrl={currentClub.logoUrl} className="h-6 w-6" />
                      <span>{localizePlainName(locale, currentClub.name)}</span>
                    </Link>
                  ) : (
                    <span className={styles.vipTeamBadge}>
                      <Shield size={16} />
                      <span>{pick(locale, 'لاعب مستقل', 'Free Agent')}</span>
                    </span>
                  )}

                  <h1 className={styles.vipTitle}>{name}</h1>

                  <div className={styles.vipMetaPills}>
                    {player.position ? (
                      <span className={styles.vipPill}>
                        <b>{localizePlainName(locale, player.position)}</b>
                      </span>
                    ) : null}
                    {player.nationality ? (
                      <span className={styles.vipPill}>
                        <span>🌍</span>
                        <span>{localizePlainName(locale, player.nationality)}</span>
                      </span>
                    ) : null}
                    {player.age != null ? (
                      <span className={styles.vipPill}>
                        <span>{player.age} {pick(locale, 'سنة', 'yrs')}</span>
                      </span>
                    ) : null}
                    {player.height ? (
                      <span className={styles.vipPill}>
                        <span>📏</span>
                        <span>{player.height}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.vipAvatarBox}>
                  <div className={styles.vipAvatarFrame}>
                    {shownShot ? (
                      <img src={shownShot} alt={name} />
                    ) : (
                      <div className={styles.vipAvatarPlaceholder}>{name.charAt(0)}</div>
                    )}
                  </div>
                  {shirt != null ? (
                    <span className={styles.vipShirtBadge} title={pick(locale, 'رقم القميص', 'Shirt number')}>
                      {shirt}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Bottom Caption */}
              <div className={styles.caption}>
                <span>
                  <b>{name}</b>
                  {clubName ? ` · ${clubName}` : ''}
                </span>
                <span>{player.position ? localizePlainName(locale, player.position) : pick(locale, 'لاعب محترف', 'Pro Player')}</span>
              </div>

              <HallBrackets />
            </div>
          </div>

          <div className={styles.program}>
            <div className={styles.chips}>
              <span className={styles.chipOn}>
                <b>{name}</b>
              </span>
              {clubName ? <span className={styles.chip}>{clubName}</span> : null}
              {player.position ? <span className={styles.chip}>{localizePlainName(locale, player.position)}</span> : null}
              {player.nationality ? <span className={styles.chip}>{localizePlainName(locale, player.nationality)}</span> : null}
            </div>
            <h2 className={styles.programTitle}>{[player.firstName, player.lastName].filter(Boolean).join(' ') || name}</h2>
            <div className={styles.acts}>
              {currentClub ? (
                <Link href={`/team/${currentClub.slug}`} className={styles.go}>
                  <span>{pick(locale, 'صفحة النادي الرسمية', 'Official Club Profile')}</span>
                  <ArrowUpRight size={14} />
                </Link>
              ) : null}
              <Link href={`/compare-players?p1=${player.slug}`} className={styles.ghost}>
                {pick(locale, 'مقارنة إحصاءات اللاعب', 'Compare Player')}
              </Link>
              {face ? (
                <button type="button" className={styles.ghost} onClick={() => setFace(null)}>
                  {pick(locale, 'استعادة صورة اللاعب', 'Reset Portrait')}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {queue.length > 0 ? (
          <aside className={styles.queue} aria-label={pick(locale, 'قائمة الزملاء', 'Teammates programme')}>
            <header className={styles.queueHead}>
              <div>
                <p>{pick(locale, 'الآن على الصالة', 'On the easel')}</p>
                <h3>{pick(locale, 'قائمة الزملاء', 'Teammates')}</h3>
              </div>
              <span className={styles.shelfBadge}>{folio(queue.length)}</span>
            </header>
            <ol className={styles.queueList}>
              {queue.map((row, index) => {
                const shot = apiSportsPlayerPhoto(row.slug.match(/(\d+)$/)?.[1], row.photoUrl);
                const active = shot && shot === shownShot;
                return (
                  <li key={row.slug}>
                    <button
                      type="button"
                      className={`${styles.queueItem}${active ? ` ${styles.on}` : ''}`}
                      onClick={() => setFace(shot)}
                      aria-pressed={Boolean(active)}
                    >
                      <span className={styles.queueNum}>{folio(index)}</span>
                      <span className={`${styles.queueThumb} ${styles.isFace}`}>
                        {shot ? <img src={shot} alt="" /> : <span>{row.name.charAt(0)}</span>}
                      </span>
                      <span className={styles.queueCopy}>
                        <b>{localizePlainName(locale, row.name)}</b>
                        <small>{row.position ? localizePlainName(locale, row.position) : pick(locale, 'زميل في الفريق', 'Teammate')}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>

      {/* ---------------- IDENTITY FACTS & KPIS ---------------- */}
      <div id="hall-stats" style={{ display: 'grid', gap: '1.25rem' }}>
        {identity.length > 0 ? (
          <div className={styles.facts}>
            {identity.map((row) => (
              <article key={row.label} className={styles.fact}>
                <em>{row.label}</em>
                <strong>{row.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        {kpis.length > 0 ? (
          <ul className={styles.kpis}>
            {kpis.map((row) => (
              <li key={row.label}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* ---------------- PERFORMANCE RADAR & SKILL BARS ---------------- */}
      {profileBars && profileBars.length > 0 ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Zap size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار القدرات والمهارات الفنية', 'Technical Skill Attributes & Radar')}</h3>
                <p>{pick(locale, 'مؤشرات الأداء الميداني المستخرجة رياضياً من بيانات الموسم.', 'Field performance ratings calculated from match season stats.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{profileBars.length}</span>
          </header>

          <div className={styles.skillBars}>
            {profileBars.map((bar) => {
              const label = locale === 'ar' ? bar.labelAr : bar.labelEn;
              const pct = Math.min(100, Math.round((bar.value / bar.max) * 100));
              return (
                <div key={bar.key} className={styles.skillBar}>
                  <div className={styles.skillBarHead}>
                    <span>{label}</span>
                    <strong style={{ color: 'var(--ys-orange)' }}>
                      {bar.value}{bar.suffix || ''}
                    </strong>
                  </div>
                  <div className={styles.skillBarTrack}>
                    <div className={styles.skillBarFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---------------- KEY RATES WALL ---------------- */}
      {rates ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Sparkles size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'معدلات الأداء لكل 90 دقيقة', 'Key Rates per 90 Minutes')}</h3>
                <p>{pick(locale, 'معدلات الفاعلية الهجومية ودقة التسديد وحسم الثنائيات.', 'Attacking efficacy, shot accuracy, and duel win rates.')}</p>
              </div>
            </div>
          </header>
          <ul className={styles.kpis}>
            {rates.goalsPer90 != null ? (
              <li>
                <strong>{rates.goalsPer90}</strong>
                <span>{pick(locale, 'أهداف / 90 دقيقة', 'Goals / 90m')}</span>
              </li>
            ) : null}
            {rates.assistsPer90 != null ? (
              <li>
                <strong>{rates.assistsPer90}</strong>
                <span>{pick(locale, 'صناعات / 90 دقيقة', 'Assists / 90m')}</span>
              </li>
            ) : null}
            {rates.shotAccuracy != null ? (
              <li>
                <strong>{rates.shotAccuracy}%</strong>
                <span>{pick(locale, 'دقة التسديد', 'Shot Accuracy')}</span>
              </li>
            ) : null}
            {rates.duelWinPct != null ? (
              <li>
                <strong>{rates.duelWinPct}%</strong>
                <span>{pick(locale, 'فوز الثنائيات', 'Duel Win Rate')}</span>
              </li>
            ) : null}
            {rates.dribbleSuccessPct != null ? (
              <li>
                <strong>{rates.dribbleSuccessPct}%</strong>
                <span>{pick(locale, 'نجاح المراوغات', 'Dribble Success')}</span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {/* ---------------- DETAILED SEASON BREAKDOWN ---------------- */}
      {seasonTotals ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Crosshair size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'السجل الإحصائي الكامل للموسم', 'Complete Season Statistical Ledger')}</h3>
                <p>{pick(locale, 'كافة الإحصائيات الفردية المسجلة من المصدر الرسمي.', 'All individual match stats verified from the official API.')}</p>
              </div>
            </div>
          </header>

          <div className={styles.facts}>
            <article className={styles.fact}>
              <em>{pick(locale, 'التسديدات على المرمى', 'Shots on Target')}</em>
              <strong>{seasonTotals.shotsOn} / {seasonTotals.shots}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'إجمالي التمريرات', 'Total Passes')}</em>
              <strong>{seasonTotals.passes}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'التمريرات المفتاحية', 'Key Passes')}</em>
              <strong>{seasonTotals.keyPasses}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'دقة التمرير', 'Pass Accuracy')}</em>
              <strong>{seasonTotals.passAccuracy != null ? `${seasonTotals.passAccuracy}%` : '–'}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'افتكاك الكرة والاعتراضات', 'Tackles & Blocks')}</em>
              <strong>{seasonTotals.tackles} / {seasonTotals.blocks}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'الثنائيات المكتسبة', 'Duels Won')}</em>
              <strong>{seasonTotals.duelsWon} / {seasonTotals.duels}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'المراوغات الناجحة', 'Successful Dribbles')}</em>
              <strong>{seasonTotals.dribbles} / {seasonTotals.dribbleAttempts}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'الأخطاء المكتسبة / المرتكبة', 'Fouls Drawn / Committed')}</em>
              <strong>{seasonTotals.foulsDrawn} / {seasonTotals.foulsCommitted}</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'البطاقات الصفراء / الحمراء', 'Yellow / Red Cards')}</em>
              <strong>{seasonTotals.yellow} 🟨 / {seasonTotals.red} 🟥</strong>
            </article>
            <article className={styles.fact}>
              <em>{pick(locale, 'ركلات الجزاء المسجلة', 'Penalties Scored')}</em>
              <strong>{seasonTotals.penaltiesScored}</strong>
            </article>
          </div>
        </section>
      ) : null}

      {/* ---------------- COMPETITIONS WALL ---------------- */}
      <section id="hall-competitions" className={styles.shelf}>
        <header className={styles.shelfHead}>
          <div className={styles.shelfTitle}>
            <div className={styles.shelfIconBox}>
              <Layers size={18} aria-hidden />
            </div>
            <div>
              <h3>{pick(locale, 'جدار المسابقات الرسمية', 'Official Competitions Wall')}</h3>
              <p>{pick(locale, 'أرقام وإحصاءات اللاعب في كل بطولة كما وثقها المصدر.', 'Player stats recorded in each tournament.')}</p>
            </div>
          </div>
          {seasonBlocks.length > 0 ? (
            <span className={styles.shelfBadge}>{seasonBlocks.length}</span>
          ) : null}
        </header>

        {seasonBlocks.length > 0 ? (
          <div className={styles.compList}>
            {seasonBlocks.map((block, index) => (
              <article key={`${block.league.id}-${index}`} className={styles.comp}>
                <div className={styles.compTop}>
                  <LeagueCrest name={block.league.name} logoUrl={block.league.logoUrl} className="h-9 w-9" />
                  <div>
                    <strong>{localizePlainName(locale, block.league.name)}</strong>
                    <em>{[localizePlainName(locale, block.team.name), block.league.season].filter(Boolean).join(' · ')}</em>
                  </div>
                </div>
                <ul className={styles.metrics}>
                  {metricGroups(block, locale).map((row) => (
                    <li key={row.label}>
                      <b>{row.value}</b>
                      <span>{row.label}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.source}>
            {pick(locale, 'لا توجد أرقام مسابقات مسجلة للموسم الحالي بعد.', 'No competition records available yet for this season.')}
          </p>
        )}
      </section>

      {/* ---------------- CLUB FIXTURES WALL ---------------- */}
      {clubFixtures.upcoming.length > 0 || clubFixtures.recent.length > 0 ? (
        <section id="hall-fixtures" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Calendar size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'مواعيد ونتائج نادي اللاعب', 'Club Fixtures & Results Wall')}</h3>
                <p>{pick(locale, 'مباريات النادي القادمة والأخيرة من المصدر الرياضي الحي.', 'Upcoming and recent club matches from live source.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{clubFixtures.upcoming.length + clubFixtures.recent.length}</span>
          </header>

          <div className={styles.slips}>
            {[...clubFixtures.upcoming, ...clubFixtures.recent].map((match) => {
              const scored = match.homeScore != null && match.awayScore != null;
              return (
                <Link key={match.id} href={`/match/${match.id}`} className={styles.slip}>
                  <div className={styles.slipTop}>
                    <span className={styles.slipRound}>{localizePlainName(locale, match.league.name)}</span>
                    {match.status === 'NOT_STARTED' ? (
                      <ClientTime value={match.kickoffAt} locale={locale} options={{ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
                    ) : (
                      <em style={{ fontStyle: 'normal', color: 'var(--ys-orange)' }}>{pick(locale, 'نهاية', 'FT')}</em>
                    )}
                  </div>
                  <div className={styles.row}>
                    <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5" />
                    <span>{localizePlainName(locale, match.homeTeam.name)}</span>
                    <strong>{scored ? match.homeScore : '–'}</strong>
                  </div>
                  <div className={styles.row}>
                    <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5" />
                    <span>{localizePlainName(locale, match.awayTeam.name)}</span>
                    <strong>{scored ? match.awayScore : '–'}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---------------- SQUAD / TEAMMATES WALL ---------------- */}
      {teammates.length > 0 ? (
        <section id="hall-squad" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Users size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار زملاء الفريق', 'Teammates & Squad Wall')}</h3>
                <p>{pick(locale, 'قائمة اللاعبين المسجلين في النادي مع صورهم ومراكزهم.', 'Registered teammates in the squad.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{teammates.length}</span>
          </header>

          <div className={styles.grid}>
            {teammates.map((row) => {
              const shot = apiSportsPlayerPhoto(row.slug.match(/(\d+)$/)?.[1], row.photoUrl);
              return (
                <Link key={row.slug} href={`/player/${row.slug}`} className={styles.tile}>
                  <span className={styles.tileShot}>
                    {shot ? <img src={shot} alt="" /> : <span>{row.name.charAt(0)}</span>}
                  </span>
                  <strong>{localizePlainName(locale, row.name)}</strong>
                  <em>{row.position ? localizePlainName(locale, row.position) : ''}</em>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---------------- TRANSFERS & CLUBS WALL ---------------- */}
      <div id="hall-transfers" className={styles.split}>
        {clubHistory.length > 0 || apiClubs.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Shield size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'سجل الأندية', 'Clubs History')}</h3>
                  <p>{pick(locale, 'الأندية التي مثلها اللاعب خلال مسيرته.', 'Clubs represented throughout career.')}</p>
                </div>
              </div>
            </header>
            <ul className={styles.people}>
              {(clubHistory.length > 0 ? clubHistory : apiClubs.map((club) => ({
                id: club.team.id,
                name: club.team.name,
                slug: '',
                logoUrl: club.team.logoUrl,
              }))).map((club) => (
                <li key={club.id}>
                  {club.slug ? (
                    <Link href={`/team/${club.slug}`}>
                      <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-7 w-7" />
                      <div>
                        <strong>{localizePlainName(locale, club.name)}</strong>
                        <em>{pick(locale, 'نادي رياضي رسمي', 'Official Sports Club')}</em>
                      </div>
                    </Link>
                  ) : (
                    <span>
                      <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-7 w-7" />
                      <div>
                        <strong>{localizePlainName(locale, club.name)}</strong>
                      </div>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {transfers.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Repeat size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'سجل الانتقالات', 'Transfers History')}</h3>
                  <p>{pick(locale, 'حركات الانتقال المسجّلة رسمياً.', 'Documented market transfers.')}</p>
                </div>
              </div>
              <span className={styles.shelfBadge}>{transfers.length}</span>
            </header>
            <ul className={styles.people}>
              {transfers.map((row) => (
                <li key={row.id}>
                  <span>
                    <span className={styles.ghostFace}>🔄</span>
                    <div>
                      <strong>
                        {[row.fromTeam, row.toTeam].filter(Boolean).map((t) => localizePlainName(locale, t as string)).join(' → ')}
                      </strong>
                      <em>{[row.type, row.fee].filter(Boolean).join(' · ')}</em>
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* ---------------- TROPHIES & HONOURS WALL ---------------- */}
      {trophies.length > 0 ? (
        <section id="hall-trophies" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Award size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار الألقاب والبطولات الذهبية', 'Trophies & Golden Honours Wall')}</h3>
                <p>{pick(locale, 'الألقاب الموثقة في السجل الرياضي من المصدر الرسمي.', 'Documented championship titles from official source.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{trophies.length}</span>
          </header>
          <div className={styles.trophyGrid}>
            {trophies.map((trophy, index) => (
              <div key={`${trophy.league}-${index}`} className={styles.trophyCard}>
                <div className={styles.trophyIconBox}>
                  <Trophy size={20} />
                </div>
                <div className={styles.trophyBody}>
                  <strong>{localizePlainName(locale, trophy.league)}</strong>
                  <em>{[trophy.season, trophy.place, trophy.country].filter(Boolean).join(' · ')}</em>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- SIDELINED & MEDICAL LEDGER ---------------- */}
      {sidelined && sidelined.length > 0 ? (
        <section id="hall-medical" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <AlertCircle size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'السجل الطبي وحالات الغياب', 'Medical Ledger & Absences')}</h3>
                <p>{pick(locale, 'تاريخ الإصابات والغيابات المسجلة رسمياً للاعب.', 'Documented injuries and recovery periods from sports data.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{sidelined.length}</span>
          </header>
          <div className={styles.injuryList}>
            {sidelined.map((item, index) => (
              <div key={`${item.type}-${index}`} className={styles.injuryCard}>
                <div className={styles.injuryBadge}>
                  <AlertCircle size={18} />
                </div>
                <div className={styles.injuryCopy}>
                  <strong>{localizePlainName(locale, item.type)}</strong>
                  <em>{[item.start, item.end].filter(Boolean).join(' — ')}</em>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- LINKED NEWS ---------------- */}
      {news && news.length > 0 ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Newspaper size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'الأخبار والتغطيات المرتبطة', 'Linked News & Coverage')}</h3>
                <p>{pick(locale, 'آخر التقارير الإخبارية عن اللاعب من المحرر الرياضي.', 'Latest editorial articles regarding the player.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{news.length}</span>
          </header>
          <ul className={styles.people}>
            {news.map((item) => (
              <li key={item.id}>
                <Link href={`/news/${item.slug}`}>
                  <span className={styles.ghostFace}>📰</span>
                  <div>
                    <strong>{item.title}</strong>
                    <em>{item.category} · <ClientTime value={item.publishedAt} locale={locale} options={{ day: 'numeric', month: 'short' }} /></em>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className={styles.source}>
        {pick(
          locale,
          'المصدر: واجهة البيانات الرياضية والصفوف المنشورة رسمياً دون أي بيانات وهمية.',
          'Source: official sports API and verified rows only — no invented data.',
        )}
      </p>
    </div>
  );
}
