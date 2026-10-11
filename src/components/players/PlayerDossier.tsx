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
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Flame,
  Info,
  Layers,
  MapPin,
  Newspaper,
  Repeat,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { formatSportFigure } from '@/lib/format/sport-figure';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { PlayerDossierData, PlayerSeasonBlock } from '@/lib/players/load-dossier';
import board from '@/components/teams/team-salon.module.css';

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
    onLoanFrom,
    confirmedFreeAgent,
    seasonBlocks,
    seasonTotals,
    rates,
    profileBars,
    trophies,
    sidelined,
    transfers,
    news,
    teammates,
    clubFixtures,
    timeline,
  } = dossier;

  const name = localizePlainName(locale, player.name);
  const portrait = apiSportsPlayerPhoto(player.externalId, player.photoUrl);
  const shirt = currentClub?.shirtNumber ?? seasonBlocks.find((block) => block.games.number != null)?.games.number;
  const clubName = currentClub ? localizePlainName(locale, currentClub.name) : null;
  const nationality = player.nationality ? localizePlainName(locale, player.nationality) : null;
  const position = player.position ? localizePlainName(locale, player.position) : null;

  return (
    <div className={board.teamPage}>
      {/* =========================================================================
          1. GOLDEN VIP PLAYER HERO BANNER
          ========================================================================= */}
      <section className={board.hero} aria-label={name}>
        <div className={board.heroAura} aria-hidden />
        <div className={board.heroGrid} aria-hidden />

        <div className={board.heroInner}>
          {/* Breadcrumb */}
          <div className={board.heroTop}>
            <div className={board.crumb}>
              <Link href="/">{pick(locale, 'الرئيسية', 'Home')}</Link>
              <span>/</span>
              {currentClub ? (
                <>
                  <Link href={`/team/${currentClub.slug}`}>{clubName}</Link>
                  <span>/</span>
                </>
              ) : null}
              <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{name}</span>
            </div>
          </div>

          {/* Hero Core: Cutout Portrait, Name, Badges */}
          <div className={board.heroStage}>
            {/* Player Avatar Wrap */}
            <div className={board.playerHeroAvatarWrap}>
              {portrait ? (
                <img src={portrait} alt={name} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
                  {name.charAt(0)}
                </div>
              )}

              {shirt != null ? (
                <span className={board.rankBadge}>
                  #{shirt}
                </span>
              ) : null}
            </div>

            {/* Player Info Details */}
            <div className={board.heroCopy}>
              <p className={board.kicker}>
                {position ? `${position} · ` : ''}
                {nationality ? `${nationality} · ` : ''}
                {pick(locale, 'لاعب كرة قدم محترف', 'Professional Player')}
              </p>

              <h1>{name}</h1>

              {/* Badges Ribbon */}
              <div className={board.chips}>
                {currentClub ? (
                  <Link href={`/team/${currentClub.slug}`} className={board.chipLink}>
                    <LeagueCrest name={currentClub.name} logoUrl={currentClub.logoUrl} className="h-4 w-4" />
                    <span style={{ marginInlineStart: '0.35rem' }}>{clubName}</span>
                  </Link>
                ) : confirmedFreeAgent ? (
                  <span className={board.chip}>
                    {pick(locale, 'لاعب حر', 'Free Agent')}
                  </span>
                ) : null}

                {onLoanFrom ? (
                  <span className={board.chip}>
                    🔄 {pick(locale, 'معار من:', 'On loan from:')} {localizePlainName(locale, onLoanFrom.name)}
                  </span>
                ) : null}

                {player.injured === true ? (
                  <span className={board.chip} style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#ef4444', fontWeight: 900 }}>
                    🚨 {pick(locale, 'مصاب حالياً', 'Injured')}
                  </span>
                ) : player.injured === false ? (
                  <span className={board.chip} style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.35)', color: '#16a34a', fontWeight: 900 }}>
                    🟢 {pick(locale, 'جاهز للمشاركة', 'Match Fit')}
                  </span>
                ) : null}

                {player.age != null ? (
                  <span className={board.chip}>
                    <Calendar size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {player.age} {pick(locale, 'سنة', 'yrs')}
                  </span>
                ) : null}

                {player.height ? (
                  <span className={board.chip}>
                    {pick(locale, 'الطول:', 'Height:')} {player.height}
                  </span>
                ) : null}

                {player.weight ? (
                  <span className={board.chip}>
                    {pick(locale, 'الوزن:', 'Weight:')} {player.weight}
                  </span>
                ) : null}

                {player.birthPlace ? (
                  <span className={board.chip}>
                    <MapPin size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {player.birthPlace}
                  </span>
                ) : null}

                {seasonTotals?.rating ? (
                  <span className={board.chip} style={{ background: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.35)', color: '#eab308' }}>
                    ★ {pick(locale, 'التقييم:', 'Rating:')} {formatSportFigure(seasonTotals.rating)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MASTER PLAYER DASHBOARD
          ========================================================================= */}
      <main style={{ maxWidth: '1320px', margin: '2rem auto 0', padding: '0 1rem', display: 'grid', gap: '2rem' }}>

        {/* ----------------- ROW 1: SEASON PERFORMANCE KPIS GRID ----------------- */}
        <div className={board.glassCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--ys-orange)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'أرقام وإحصاءات اللاعب هذا الموسم', 'Season Performance Overview')}
              </h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'مباريات الظهور', 'Appearances')}</span>
              <strong className={board.statBoxValue}>{seasonTotals?.appearances ?? '–'}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'تشكيلة أساسية', 'Starts')}</span>
              <strong className={board.statBoxValue}>{seasonTotals?.lineups ?? '–'}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: 'var(--ys-orange)' }}>{pick(locale, 'الأهداف المسجلة', 'Goals')}</span>
              <strong className={board.statBoxValue} style={{ color: 'var(--ys-orange)' }}>{seasonTotals?.goals ?? 0}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: '#0284c7' }}>{pick(locale, 'صناعة الأهداف', 'Assists')}</span>
              <strong className={board.statBoxValue} style={{ color: '#0284c7' }}>{seasonTotals?.assists ?? 0}</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'دقائق اللعب', 'Minutes')}</span>
              <strong className={board.statBoxValue}>{seasonTotals?.minutes ?? 0}&prime;</strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle} style={{ color: '#eab308' }}>{pick(locale, 'التقييم الفني', 'Rating')}</span>
              <strong className={board.statBoxValue} style={{ color: '#eab308' }}>
                {seasonTotals?.rating ? formatSportFigure(seasonTotals.rating) : '–'}
              </strong>
            </div>

            <div className={board.statBox}>
              <span className={board.statBoxTitle}>{pick(locale, 'بطاقات ملونة', 'Cards')}</span>
              <strong className={board.statBoxValue} style={{ fontSize: '1.1rem' }}>
                🟨 {seasonTotals?.yellow ?? 0} · 🟥 {seasonTotals?.red ?? 0}
              </strong>
            </div>
          </div>

          {/* Rates & Per 90 metrics */}
          {rates && (rates.goalsPer90 != null || rates.shotAccuracy != null || rates.duelWinPct != null) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              {rates.goalsPer90 != null ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'معدل الأهداف / 90 دقيقة', 'Goals / 90m')}</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--ys-orange)' }}>{rates.goalsPer90}</strong>
                </div>
              ) : null}

              {rates.shotAccuracy != null ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'دقة التسديد على المرمى', 'Shot Accuracy')}</span>
                  <strong style={{ fontSize: '0.9rem' }}>{rates.shotAccuracy}%</strong>
                </div>
              ) : null}

              {rates.duelWinPct != null ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{pick(locale, 'نسبة الفوز بالالتحامات', 'Duel Win Rate')}</span>
                  <strong style={{ fontSize: '0.9rem' }}>{rates.duelWinPct}%</strong>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ----------------- ROW 2: PER-COMPETITION BREAKDOWN TABLE ----------------- */}
        {seasonBlocks.length > 0 ? (
          <section className={board.glassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Layers size={18} style={{ color: 'var(--ys-orange)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'أرقام اللاعب حسب المسابقة والبطولة', 'Per-Competition Statistics')}
              </h3>
            </div>

            <div className={board.standingsTableWrapper}>
              <table className={board.standingsTable}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'start' }}>{pick(locale, 'البطولة والنادي', 'Competition & Team')}</th>
                    <th>{pick(locale, 'ظهور', 'Apps')}</th>
                    <th>{pick(locale, 'أساسي', 'Starts')}</th>
                    <th>{pick(locale, 'دقائق', 'Mins')}</th>
                    <th style={{ color: 'var(--ys-orange)' }}>{pick(locale, 'أهداف', 'Goals')}</th>
                    <th style={{ color: '#0284c7' }}>{pick(locale, 'صناعة', 'Assists')}</th>
                    <th>{pick(locale, 'بطاقات', 'Cards')}</th>
                    <th style={{ color: '#eab308' }}>{pick(locale, 'التقييم', 'Rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonBlocks.map((b, idx) => (
                    <tr key={`${b.league.name}-${idx}`}>
                      <td style={{ textAlign: 'start', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <LeagueCrest name={b.league.name} logoUrl={b.league.logoUrl} className="h-5 w-5" />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.85rem' }}>{localizePlainName(locale, b.league.name)}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{localizePlainName(locale, b.team.name)}</span>
                        </div>
                      </td>
                      <td>{b.games.appearances ?? '–'}</td>
                      <td>{b.games.lineups ?? '–'}</td>
                      <td>{b.games.minutes ?? 0}&prime;</td>
                      <td style={{ fontWeight: 900, color: 'var(--ys-orange)' }}>{b.goals.total ?? 0}</td>
                      <td style={{ fontWeight: 900, color: '#0284c7' }}>{b.goals.assists ?? 0}</td>
                      <td>🟨 {b.cards.yellow ?? 0} {b.cards.red ? `· 🟥 ${b.cards.red}` : ''}</td>
                      <td style={{ fontWeight: 800, color: '#eab308' }}>{formatSportFigure(b.games.rating) ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* ----------------- ROW 3: TRANSFERS & CAREER JOURNEY + TROPHIES ----------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Transfer History */}
          <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Repeat size={18} style={{ color: 'var(--ys-orange)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'سجل الانتقالات ومسيرة الأندية', 'Career Transfers & Moves')}
              </h3>
            </div>

            {transfers.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {transfers.map((t, idx) => (
                  <div key={t.id || idx} className={board.transferItem}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        {t.fromTeam ? `${localizePlainName(locale, t.fromTeam)} ${locale === 'ar' ? '←' : '→'} ` : ''}
                        {localizePlainName(locale, t.toTeam) || pick(locale, 'انتقال رسمي', 'Transfer')}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {t.date ? (
                          <ClientTime value={t.date} locale={locale} options={{ day: 'numeric', month: 'short', year: 'numeric' }} />
                        ) : null}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ys-orange)' }}>
                      {t.fee || pick(locale, 'صفقة انتقال', 'Transfer')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', margin: '1.5rem 0' }}>
                {pick(locale, 'سجل الانتقالات لم يتم تسجيله.', 'No recorded transfers.')}
              </p>
            )}
          </div>

          {/* Trophies & Honours */}
          <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} style={{ color: '#eab308' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'سجل الألقاب والبطولات الموثقة', 'Honours & Trophies Won')}
              </h3>
            </div>

            {trophies.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {trophies.map((tr, idx) => {
                  const isGold = tr.place?.toLowerCase().includes('winner') || tr.place === '1';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                        border: '1px solid var(--border)',
                        borderRadius: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{isGold ? '🥇' : '🏆'}</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--foreground)' }}>
                            {localizePlainName(locale, tr.league)}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                            {[tr.season, tr.country ? localizePlainName(locale, tr.country) : null].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </div>

                      {tr.place ? (
                        <span style={{ fontSize: '0.76rem', fontWeight: 900, color: isGold ? '#eab308' : 'var(--muted-foreground)' }}>
                          {tr.place}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', margin: '1.5rem 0' }}>
                {pick(locale, 'الألقاب والبطولات جاري تحديثها وتوثيقها.', 'Trophies record is being updated.')}
              </p>
            )}
          </div>
        </div>

        {/* ----------------- ROW 4: CLUB MATCH FIXTURES (UPCOMING & RECENT) ----------------- */}
        {clubFixtures && (clubFixtures.upcoming?.length > 0 || clubFixtures.recent?.length > 0) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {clubFixtures.upcoming?.length > 0 ? (
              <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} style={{ color: 'var(--ys-orange)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                    {pick(locale, 'المباريات القادمة لنادي اللاعب', 'Upcoming Club Matches')}
                  </h3>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {clubFixtures.upcoming.slice(0, 3).map((m) => (
                    <Link
                      key={m.id}
                      href={`/match/${m.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                        border: '1px solid var(--border)',
                        borderRadius: '0.85rem',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <LeagueCrest name={m.homeTeam.name} logoUrl={m.homeTeam.logoUrl} className="h-6 w-6" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{localizePlainName(locale, m.homeTeam.name)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ys-orange)', fontWeight: 900 }}>{pick(locale, 'ضد', 'vs')}</span>
                        <LeagueCrest name={m.awayTeam.name} logoUrl={m.awayTeam.logoUrl} className="h-6 w-6" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{localizePlainName(locale, m.awayTeam.name)}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        <ClientTime value={m.kickoffAt} locale={locale} options={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {clubFixtures.recent?.length > 0 ? (
              <div className={board.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={18} style={{ color: 'var(--ys-orange)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                    {pick(locale, 'آخر نتائج مباريات نادي اللاعب', 'Recent Club Results')}
                  </h3>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {clubFixtures.recent.slice(0, 3).map((m) => (
                    <Link
                      key={m.id}
                      href={`/match/${m.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                        border: '1px solid var(--border)',
                        borderRadius: '0.85rem',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{localizePlainName(locale, m.homeTeam.name)}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--ys-orange)', background: 'color-mix(in srgb, var(--foreground) 6%, var(--card))', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>
                          {m.homeScore ?? 0} - {m.awayScore ?? 0}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{localizePlainName(locale, m.awayTeam.name)}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {localizePlainName(locale, m.league.name)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ----------------- ROW 5: RECENT MATCH IMPACT & TIMELINE ----------------- */}
        {timeline.length > 0 ? (
          <section className={board.glassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Zap size={18} style={{ color: 'var(--ys-orange)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'سجل الأهداف والمساهمات في المباريات الأخيرة', 'Recent Match Impact & Key Events')}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {timeline.slice(0, 6).map((ev) => (
                <Link
                  key={ev.id}
                  href={`/match/${ev.match.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                    border: '1px solid var(--border)',
                    borderRadius: '0.85rem',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {ev.type === 'GOAL' || ev.type === 'PENALTY' ? '⚽' : ev.type === 'YELLOW_CARD' ? '🟨' : ev.type === 'RED_CARD' ? '🟥' : '⚡'}
                    </span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem' }}>
                        {ev.type === 'GOAL' ? pick(locale, 'هدف مسجل', 'Goal') : ev.type === 'PENALTY' ? pick(locale, 'ضربة جزاء مسجلة', 'Penalty Goal') : ev.type}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {localizePlainName(locale, ev.match.homeTeam.name)} {ev.match.homeScore ?? 0} - {ev.match.awayScore ?? 0} {localizePlainName(locale, ev.match.awayTeam.name)}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--ys-orange)' }}>
                    {ev.minute}&prime;
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* ----------------- ROW 6: LOCKER ROOM TEAMMATES & MEDICAL LOG ----------------- */}
        {teammates.length > 0 ? (
          <section className={board.glassCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} style={{ color: 'var(--ys-orange)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                  {pick(locale, 'زملاء الفريق في النادي الحالي', 'Current Club Teammates')}
                </h3>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{teammates.length} {pick(locale, 'لاعباً', 'Players')}</span>
            </div>

            <div className={board.squadGrid}>
              {teammates.slice(0, 12).map((tm) => {
                const shot = apiSportsPlayerPhoto(tm.slug.match(/(\d+)$/)?.[1], tm.photoUrl);
                return (
                  <Link
                    key={tm.slug}
                    href={`/player/${tm.slug}`}
                    className={board.playerCard}
                  >
                    {tm.shirtNumber != null ? (
                      <span className={board.playerShirtBadge}>
                        #{tm.shirtNumber}
                      </span>
                    ) : null}

                    <div className={board.playerCardAvatar}>
                      {shot ? (
                        <img src={shot} alt={tm.name} loading="lazy" />
                      ) : (
                        <span className={board.playerCardAvatarFallback}>
                          {tm.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <strong className={board.playerName}>
                      {localizePlainName(locale, tm.name)}
                    </strong>
                    <span className={board.playerMeta}>
                      {tm.position ? localizePlainName(locale, tm.position) : ''}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Medical & Injury Log if present */}
        {sidelined.length > 0 ? (
          <section className={board.glassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                {pick(locale, 'السجل الطبي وتاريخ الإصابات', 'Medical & Injury Record')}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {sidelined.map((item, idx) => (
                <div key={idx} style={{ padding: '0.75rem 1rem', background: 'color-mix(in srgb, #ef4444 6%, var(--card))', border: '1px solid color-mix(in srgb, #ef4444 20%, var(--border))', borderRadius: '0.75rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ef4444' }}>{item.type}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{[item.start, item.end].filter(Boolean).join(' — ')}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      </main>
    </div>
  );
}
