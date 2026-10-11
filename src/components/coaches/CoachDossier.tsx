'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Activity,
  ArrowUpRight,
  Award,
  Calendar,
  Clock,
  Flame,
  Globe,
  MapPin,
  Newspaper,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { CareerStint, CoachDossierData, CoachMatch } from '@/lib/coaches/load-dossier';
import styles from './coach-salon.module.css';
import { FollowButton } from '../common/FollowButton';

function ageFrom(birth: Date) {
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 20 && age <= 90 ? age : null;
}

type SquadTab = 'ALL' | 'GK' | 'DF' | 'MF' | 'FW';

export function CoachDossier({ locale, dossier }: { locale: string; dossier: CoachDossierData }) {
  const { coach, club, squad, career, trophies, recentMatches, upcoming, news } = dossier;

  const name = localizePlainName(locale, coach.name);
  const portrait = apiSportsCoachPhoto(coach.slug?.match(/(\d+)$/)?.[1] || coach.id, coach.photoUrl);
  const clubName = club ? localizePlainName(locale, club.name) : null;
  const age = coach.birthDate ? ageFrom(new Date(coach.birthDate)) : null;

  const [squadTab, setSquadTab] = useState<SquadTab>('ALL');

  const matchTotal = career.reduce(
    (sum, row) => sum + (typeof row.matches === 'number' ? row.matches : 0),
    0
  );

  // Group squad by position
  const squadByPos = useMemo(() => {
    const gk: typeof squad = [];
    const df: typeof squad = [];
    const mf: typeof squad = [];
    const fw: typeof squad = [];

    for (const item of squad) {
      const pos = (item.player.position || '').toLowerCase();
      if (pos.includes('goalkeeper') || pos.includes('حارس') || pos === 'gk' || pos === 'g') {
        gk.push(item);
      } else if (pos.includes('defender') || pos.includes('مدافع') || pos === 'df' || pos === 'd') {
        df.push(item);
      } else if (pos.includes('midfield') || pos.includes('وسط') || pos === 'mf' || pos === 'm') {
        mf.push(item);
      } else {
        fw.push(item);
      }
    }
    return { gk, df, mf, fw };
  }, [squad]);

  const filteredSquad = useMemo(() => {
    if (squadTab === 'GK') return squadByPos.gk;
    if (squadTab === 'DF') return squadByPos.df;
    if (squadTab === 'MF') return squadByPos.mf;
    if (squadTab === 'FW') return squadByPos.fw;
    return squad;
  }, [squadTab, squadByPos, squad]);

  // Managerial match record from recent matches
  const matchStats = useMemo(() => {
    if (!club || recentMatches.length === 0) return null;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let scored = 0;
    let conceded = 0;

    const form: Array<{ letter: 'W' | 'D' | 'L'; matchId: string; opponent: string }> = [];

    for (const m of recentMatches) {
      if (m.homeScore == null || m.awayScore == null) continue;
      const isHome = m.homeTeam.name.toLowerCase() === club.name.toLowerCase();
      const clubGoals = isHome ? m.homeScore : m.awayScore;
      const oppGoals = isHome ? m.awayScore : m.homeScore;
      const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;

      scored += clubGoals;
      conceded += oppGoals;

      if (clubGoals > oppGoals) {
        wins++;
        form.push({ letter: 'W', matchId: m.id, opponent });
      } else if (clubGoals === oppGoals) {
        draws++;
        form.push({ letter: 'D', matchId: m.id, opponent });
      } else {
        losses++;
        form.push({ letter: 'L', matchId: m.id, opponent });
      }
    }

    const total = wins + draws + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { total, wins, draws, losses, scored, conceded, winRate, form };
  }, [club, recentMatches]);

  return (
    <div className={styles.coachPage}>
      {/* =========================================================================
          1. MEGA HERO STAGE
          ========================================================================= */}
      <section className={styles.hero} aria-label={name}>
        <div className={styles.heroAura} aria-hidden />
        <div className={styles.heroGrid} aria-hidden />

        <div className={styles.heroInner}>
          {/* Breadcrumb & Actions */}
          <div className={styles.heroTop}>
            <div className={styles.crumb}>
              <Link href="/">{pick(locale, 'الرئيسية', 'Home')}</Link>
              <span>/</span>
              <span>{pick(locale, 'المدربون الفنيون', 'Head Coaches')}</span>
              <span>/</span>
              <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>{name}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: name, url: window.location.href });
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.95rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>{pick(locale, 'مشاركة الملف', 'Share Profile')}</span>
            </button>
          </div>

          {/* Hero Core */}
          <div className={styles.heroStage}>
            {/* Coach Portrait Avatar */}
            <div className={styles.avatarWrap}>
              {portrait ? (
                <img src={portrait} alt={name} />
              ) : (
                <div className={styles.avatarFallback}>{name.charAt(0)}</div>
              )}
            </div>

            {/* Coach Info Details */}
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>
                {coach.nationality ? `${localizePlainName(locale, coach.nationality)} · ` : ''}
                {pick(locale, 'المدير الفني الرسمي', 'Official Head Coach')}
              </p>

              <h1>{name}</h1>

              {/* Badges Ribbon */}
              <div className={styles.chips}>
                <span className={styles.chip}>
                  <Shield size={13} style={{ marginInlineEnd: '0.35rem', color: 'var(--ys-orange)' }} />
                  {pick(locale, 'مدير فني', 'Head Coach')}
                </span>

                {club ? (
                  <Link href={`/team/${club.slug}`} className={styles.chipLink}>
                    <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-4 w-4" />
                    <span>{clubName}</span>
                    <ArrowUpRight size={13} />
                  </Link>
                ) : null}

                {coach.nationality ? (
                  <span className={styles.chip}>
                    <Globe size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {localizePlainName(locale, coach.nationality)}
                  </span>
                ) : null}

                {age != null ? (
                  <span className={styles.chip}>
                    <Calendar size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {age} {pick(locale, 'سنة', 'yrs')}
                  </span>
                ) : null}

                {trophies.length > 0 ? (
                  <span className={styles.chip} style={{ color: '#eab308' }}>
                    <Award size={13} style={{ marginInlineEnd: '0.35rem', color: '#eab308' }} />
                    {trophies.length} {pick(locale, 'بطولات وألقاب', 'Honours')}
                  </span>
                ) : null}

                {career.length > 0 ? (
                  <span className={styles.chip}>
                    <Activity size={13} style={{ marginInlineEnd: '0.35rem' }} />
                    {career.length} {pick(locale, 'محطات تدريبية', 'Career Stints')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. DASHBOARD CONTENT GRID
          ========================================================================= */}
      <main className={styles.main}>
        {/* ----------------- ROW 1: KPIS & ANALYTICS ----------------- */}
        <section className={styles.glassCard}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>
              <TrendingUp size={18} style={{ color: 'var(--ys-orange)' }} />
              {pick(locale, 'السجل الإحصائي والأرقام التدريبية', 'Managerial Record & Performance')}
            </h3>
            {matchStats && matchStats.form.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', marginInlineEnd: '0.25rem' }}>
                  {pick(locale, 'النتائج الأخيرة:', 'Recent Form:')}
                </span>
                {matchStats.form.slice(0, 5).map((f, idx) => (
                  <Link
                    key={`${f.matchId}-${idx}`}
                    href={`/match/${f.matchId}`}
                    style={{
                      width: '1.65rem',
                      height: '1.65rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      textDecoration: 'none',
                      color: '#fff',
                      background: f.letter === 'W' ? '#16a34a' : f.letter === 'D' ? '#ca8a04' : '#dc2626',
                    }}
                    title={`${f.letter} vs ${f.opponent}`}
                  >
                    {f.letter === 'W' ? pick(locale, 'ف', 'W') : f.letter === 'D' ? pick(locale, 'ت', 'D') : pick(locale, 'خ', 'L')}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
            {matchTotal > 0 ? (
              <div className={styles.statBox}>
                <span className={styles.statBoxTitle}>{pick(locale, 'مباريات المسيرة', 'Career Matches')}</span>
                <strong className={styles.statBoxValue}>{matchTotal}</strong>
              </div>
            ) : null}

            {matchStats ? (
              <>
                <div className={styles.statBox}>
                  <span className={styles.statBoxTitle} style={{ color: '#16a34a' }}>{pick(locale, 'الانتصارات', 'Wins')}</span>
                  <strong className={styles.statBoxValue} style={{ color: '#16a34a' }}>{matchStats.wins}</strong>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxTitle} style={{ color: '#ca8a04' }}>{pick(locale, 'التعادلات', 'Draws')}</span>
                  <strong className={styles.statBoxValue} style={{ color: '#ca8a04' }}>{matchStats.draws}</strong>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxTitle} style={{ color: '#dc2626' }}>{pick(locale, 'الهزائم', 'Losses')}</span>
                  <strong className={styles.statBoxValue} style={{ color: '#dc2626' }}>{matchStats.losses}</strong>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxTitle} style={{ color: 'var(--ys-orange)' }}>{pick(locale, 'نسبة الفوز الحالية', 'Win Rate')}</span>
                  <strong className={styles.statBoxValue} style={{ color: 'var(--ys-orange)' }}>{matchStats.winRate}%</strong>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statBoxTitle}>{pick(locale, 'أهداف له / عليه', 'GF : GA')}</span>
                  <strong className={styles.statBoxValue}>{matchStats.scored} : {matchStats.conceded}</strong>
                </div>
              </>
            ) : null}

            {trophies.length > 0 ? (
              <div className={styles.statBox}>
                <span className={styles.statBoxTitle} style={{ color: '#eab308' }}>{pick(locale, 'الألقاب الموثقة', 'Honours')}</span>
                <strong className={styles.statBoxValue} style={{ color: '#eab308' }}>{trophies.length}</strong>
              </div>
            ) : null}

            {career.length > 0 ? (
              <div className={styles.statBox}>
                <span className={styles.statBoxTitle}>{pick(locale, 'أندية تم تدريبها', 'Clubs Managed')}</span>
                <strong className={styles.statBoxValue}>{career.length}</strong>
              </div>
            ) : null}
          </div>
        </section>

        {/* ----------------- ROW 2: TACTICAL VISION & BIOGRAPHY ----------------- */}
        {coach.bio ? (
          <section className={styles.glassCard}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>
                <Sparkles size={18} style={{ color: 'var(--ys-orange)' }} />
                {pick(locale, 'الرؤية التكتيكية والسيرة المهنية', 'Tactical Vision & Biography')}
              </h3>
            </div>
            <p className={styles.bioText}>{coach.bio}</p>
          </section>
        ) : null}

        {/* ----------------- ROW 3: HONOURS & TROPHIES SHOWCASE ----------------- */}
        {trophies.length > 0 ? (
          <section className={styles.glassCard}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Award size={18} style={{ color: '#eab308' }} />
                  {pick(locale, 'خزانة الألقاب والبطولات الكبرى', 'Official Honours & Major Trophies')}
                </h3>
                <p className={styles.cardSubtitle}>
                  {pick(locale, 'البطولات الرسمية الكبرى المحققة عبر المسيرة التدريبية.', 'Official domestic & continental championships won.')}
                </p>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#eab308', background: 'color-mix(in srgb, #eab308 14%, var(--card))', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid color-mix(in srgb, #eab308 30%, transparent)' }}>
                {trophies.length} {pick(locale, 'لقب تاريخي', 'Trophies')}
              </span>
            </div>

            <div className={styles.trophiesGrid}>
              {trophies.map((tr) => (
                <div key={tr.id} className={styles.trophyCard}>
                  <div className={styles.trophyIconBox}>🏆</div>
                  <div className={styles.trophyInfo}>
                    <strong className={styles.trophyTitle}>
                      {localizePlainName(locale, tr.title)}
                    </strong>
                    <span className={styles.trophyMeta}>
                      {[tr.season, tr.teamName ? localizePlainName(locale, tr.teamName) : null].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ----------------- ROW 4: MANAGERIAL CAREER TIMELINE ----------------- */}
        {career.length > 0 ? (
          <section className={styles.glassCard}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Clock size={18} style={{ color: 'var(--ys-orange)' }} />
                  {pick(locale, 'السجل والمحطات التدريبية عبر التاريخ', 'Managerial Career History & Stints')}
                </h3>
                <p className={styles.cardSubtitle}>
                  {pick(locale, 'جميع الأندية والمنتخبات التي تولى قيادتها الفنية بالترتيب الزمني.', 'Chronological list of clubs and stints.')}
                </p>
              </div>
            </div>

            <div className={styles.careerTimeline}>
              {career.map((stint, idx) => (
                <div key={`${stint.club}-${idx}`} className={styles.careerCard}>
                  <div className={styles.careerLogo}>
                    {stint.clubLogo ? (
                      <img src={stint.clubLogo} alt={stint.club} />
                    ) : (
                      <LeagueCrest name={stint.club} className="h-8 w-8" />
                    )}
                  </div>
                  <div className={styles.careerInfo}>
                    <strong className={styles.careerClub}>
                      {localizePlainName(locale, stint.club)}
                    </strong>
                    <span className={styles.careerYears}>
                      {[stint.from, stint.to || pick(locale, 'الآن', 'Present')].filter(Boolean).join(' — ')}
                    </span>
                    <span className={styles.careerRole}>
                      {stint.role ? localizePlainName(locale, stint.role) : pick(locale, 'مدير فني', 'Manager')}
                      {stint.matches ? ` · ${stint.matches} ${pick(locale, 'مباراة', 'matches')}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ----------------- ROW 5: SQUAD UNDER MANAGEMENT ----------------- */}
        {squad.length > 0 ? (
          <section className={styles.glassCard}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Users size={18} style={{ color: 'var(--ys-orange)' }} />
                  {pick(locale, 'قائمة لاعبي الفريق تحت قيادة المدرب', 'Squad Roster Under Management')}
                </h3>
                <p className={styles.cardSubtitle}>
                  {pick(locale, 'جميع عناصر الفريق الأول مع أرقام القمصان والمراكز.', 'Current senior squad registered under the coach.')}
                </p>
              </div>

              {/* Positional Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => setSquadTab('ALL')}
                  style={{
                    cursor: 'pointer',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    border: squadTab === 'ALL' ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                    background: squadTab === 'ALL' ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                    color: squadTab === 'ALL' ? '#111' : 'var(--foreground)',
                  }}
                >
                  {pick(locale, 'الكل', 'All')} ({squad.length})
                </button>
                {squadByPos.gk.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSquadTab('GK')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: squadTab === 'GK' ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                      background: squadTab === 'GK' ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                      color: squadTab === 'GK' ? '#111' : 'var(--foreground)',
                    }}
                  >
                    {pick(locale, 'حراس المرمى', 'GK')} ({squadByPos.gk.length})
                  </button>
                ) : null}
                {squadByPos.df.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSquadTab('DF')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: squadTab === 'DF' ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                      background: squadTab === 'DF' ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                      color: squadTab === 'DF' ? '#111' : 'var(--foreground)',
                    }}
                  >
                    {pick(locale, 'الدفاع', 'DF')} ({squadByPos.df.length})
                  </button>
                ) : null}
                {squadByPos.mf.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSquadTab('MF')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: squadTab === 'MF' ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                      background: squadTab === 'MF' ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                      color: squadTab === 'MF' ? '#111' : 'var(--foreground)',
                    }}
                  >
                    {pick(locale, 'الوسط', 'MF')} ({squadByPos.mf.length})
                  </button>
                ) : null}
                {squadByPos.fw.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSquadTab('FW')}
                    style={{
                      cursor: 'pointer',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      border: squadTab === 'FW' ? '1px solid var(--ys-orange)' : '1px solid var(--border)',
                      background: squadTab === 'FW' ? 'var(--ys-orange)' : 'color-mix(in srgb, var(--foreground) 3%, var(--card))',
                      color: squadTab === 'FW' ? '#111' : 'var(--foreground)',
                    }}
                  >
                    {pick(locale, 'الهجوم', 'FW')} ({squadByPos.fw.length})
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.squadGrid}>
              {filteredSquad.map((entry) => {
                const shot = apiSportsPlayerPhoto(
                  entry.player.slug.match(/(\d+)$/)?.[1],
                  entry.player.photoUrl
                );
                return (
                  <Link
                    key={entry.id}
                    href={`/player/${entry.player.slug}`}
                    className={styles.playerCard}
                  >
                    {entry.shirtNumber != null ? (
                      <span className={styles.playerShirtBadge}>
                        #{entry.shirtNumber}
                      </span>
                    ) : null}

                    <div className={styles.playerCardAvatar}>
                      {shot ? (
                        <img src={shot} alt={entry.player.name} loading="lazy" />
                      ) : (
                        <span className={styles.playerCardAvatarFallback}>
                          {entry.player.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <strong className={styles.playerName}>
                      {localizePlainName(locale, entry.player.name)}
                    </strong>
                    <span className={styles.playerMeta}>
                      {[
                        entry.player.position ? localizePlainName(locale, entry.player.position) : null,
                        entry.player.age ? `${entry.player.age} ${pick(locale, 'سنة', 'y/o')}` : null,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ----------------- ROW 6: CLUB FIXTURES & RESULTS ----------------- */}
        {upcoming.length > 0 || recentMatches.length > 0 ? (
          <section className={styles.glassCard}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>
                  <Calendar size={18} style={{ color: 'var(--ys-orange)' }} />
                  {pick(locale, 'مواعيد ونتائج مباريات الفريق', 'Club Fixtures & Recent Match Results')}
                </h3>
              </div>
            </div>

            <div className={styles.slipsGrid}>
              {[...upcoming, ...recentMatches].map((match) => {
                const scored = match.homeScore != null && match.awayScore != null;
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className={styles.slip}>
                    <div className={styles.slipHead}>
                      <span>{localizePlainName(locale, match.league.name)}</span>
                      {match.status === 'NOT_STARTED' ? (
                        <ClientTime
                          value={match.kickoffAt}
                          locale={locale}
                          options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
                        />
                      ) : (
                        <span style={{ color: 'var(--ys-orange)', fontWeight: 900 }}>
                          {pick(locale, 'نهاية المباراة', 'FT')}
                        </span>
                      )}
                    </div>

                    <div className={styles.slipRow}>
                      <div className={styles.slipRowTeam}>
                        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5" />
                        <span>{localizePlainName(locale, match.homeTeam.name)}</span>
                      </div>
                      <strong>{scored ? match.homeScore : '–'}</strong>
                    </div>

                    <div className={styles.slipRow}>
                      <div className={styles.slipRowTeam}>
                        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5" />
                        <span>{localizePlainName(locale, match.awayTeam.name)}</span>
                      </div>
                      <strong>{scored ? match.awayScore : '–'}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
