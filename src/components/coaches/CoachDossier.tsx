'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Activity,
  ArrowUpRight,
  Award,
  Calendar,
  Flame,
  Newspaper,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { CareerStint, CoachDossierData, CoachMatch } from '@/lib/coaches/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

function ageFrom(birth: Date) {
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 20 && age <= 90 ? age : null;
}

function Slip({ match, locale }: { match: CoachMatch; locale: string }) {
  const scored = match.homeScore != null && match.awayScore != null;
  return (
    <Link href={`/match/${match.id}`} className={styles.slip}>
      <div className={styles.slipTop}>
        <span className={styles.slipRound}>{localizePlainName(locale, match.league.name)}</span>
        {match.status === 'NOT_STARTED' ? (
          <ClientTime
            value={match.kickoffAt}
            locale={locale}
            options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
          />
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
}

export function CoachDossier({ locale, dossier }: { locale: string; dossier: CoachDossierData }) {
  const { coach, club, squad, career, trophies, recentMatches, upcoming, news } = dossier;
  const name = localizePlainName(locale, coach.name);
  const portrait = apiSportsCoachPhoto(coach.slug.match(/(\d+)$/)?.[1], coach.photoUrl);
  const clubName = club ? localizePlainName(locale, club.name) : null;
  const age = coach.birthDate ? ageFrom(coach.birthDate) : null;
  const [active, setActive] = useState(0);
  const stint = career[active] || career[0] || null;
  const matchTotal = career.reduce((sum, row) => sum + (typeof row.matches === 'number' ? row.matches : 0), 0);

  const identity = [
    coach.nationality ? { label: pick(locale, 'الجنسية', 'Nationality'), value: localizePlainName(locale, coach.nationality) } : null,
    coach.birthDate
      ? {
        label: pick(locale, 'تاريخ الميلاد', 'Birth Date'),
        value: new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(coach.birthDate)),
      }
      : null,
    age != null ? { label: pick(locale, 'العمر', 'Age'), value: `${age} ${pick(locale, 'سنة', 'yrs')}` } : null,
    coach.birthPlace ? { label: pick(locale, 'مكان الميلاد', 'Birthplace'), value: coach.birthPlace } : null,
    coach.height ? { label: pick(locale, 'الطول', 'Height'), value: coach.height } : null,
    coach.weight ? { label: pick(locale, 'الوزن', 'Weight'), value: coach.weight } : null,
    clubName ? { label: pick(locale, 'النادي الحالي', 'Current Club'), value: clubName } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const kpis = [
    matchTotal > 0 ? { label: pick(locale, 'مباريات المسيرة', 'Career Matches'), value: matchTotal } : null,
    trophies.length > 0 ? { label: pick(locale, 'الألقاب الموثقة', 'Honours'), value: trophies.length } : null,
    career.length > 0 ? { label: pick(locale, 'محطات تدريبية', 'Career Stints'), value: career.length } : null,
    squad.length > 0 ? { label: pick(locale, 'قائمة الفريق', 'Squad Size'), value: squad.length } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return (
    <div className={`${styles.hall} ${styles.leatherHall}`}>
      {/* ---------------- FOYER SUB-NAVIGATION ---------------- */}
      <nav className={styles.foyer} aria-label={pick(locale, 'أقسام ملف المدرب', 'Coach profile sections')}>
        <div className={styles.foyerTabs}>
          <a href="#hall-screen" className={`${styles.foyerTab} ${styles.isOn}`}>
            <Flame size={14} aria-hidden />
            <span>{pick(locale, 'منصة المدرب', 'Coach Cinema')}</span>
          </a>
          {identity.length > 0 || kpis.length > 0 ? (
            <a href="#hall-stats" className={styles.foyerTab}>
              <Activity size={14} aria-hidden />
              <span>{pick(locale, 'البيانات والأرقام', 'Facts & Numbers')}</span>
            </a>
          ) : null}
          {squad.length > 0 ? (
            <a href="#hall-squad" className={styles.foyerTab}>
              <Users size={14} aria-hidden />
              <span>{pick(locale, 'قائمة الفريق', 'Squad Roster')}</span>
              <span className={styles.foyerBadge}>{squad.length}</span>
            </a>
          ) : null}
          {upcoming.length > 0 || recentMatches.length > 0 ? (
            <a href="#hall-fixtures" className={styles.foyerTab}>
              <Calendar size={14} aria-hidden />
              <span>{pick(locale, 'مواعيد ونتائج النادي', 'Matches')}</span>
              <span className={styles.foyerBadge}>{upcoming.length + recentMatches.length}</span>
            </a>
          ) : null}
          {trophies.length > 0 ? (
            <a href="#hall-trophies" className={styles.foyerTab}>
              <Award size={14} aria-hidden />
              <span>{pick(locale, 'الألقاب والبطولات', 'Honours')}</span>
              <span className={styles.foyerBadge}>{trophies.length}</span>
            </a>
          ) : null}
        </div>
      </nav>

      {/* ---------------- CONSOLE (CHASSIS + QUEUE) ---------------- */}
      <div id="hall-screen" className={styles.console}>
        <section className={styles.screen}>
          <div className={styles.chassis}>
            <HallBezel
              label={pick(locale, 'صالة المدرب', 'Coach salon')}
              clock={career.length ? `${folio(active)} / ${folio(career.length)}` : 'PRO TACTICS'}
            />
            <div className={styles.frame}>
              {/* VIP Coach Stage */}
              <div className={styles.vipCard}>
                <div className={styles.vipInfo}>
                  {club ? (
                    <div className={styles.vipCrestBadge}>
                      <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-5 w-5" />
                      <span>{clubName}</span>
                    </div>
                  ) : null}

                  <h2 className={styles.vipTitle}>{name}</h2>

                  <div className={styles.vipMetaPills}>
                    <span className={styles.vipPill}>
                      <Shield size={12} aria-hidden />
                      {pick(locale, 'مدرب فني', 'Head Coach')}
                    </span>
                    {coach.nationality ? (
                      <span className={styles.vipPill}>
                        {localizePlainName(locale, coach.nationality)}
                      </span>
                    ) : null}
                    {age != null ? (
                      <span className={styles.vipPill}>
                        {age} {pick(locale, 'سنة', 'y/o')}
                      </span>
                    ) : null}
                    {career.length > 0 ? (
                      <span className={styles.vipPill}>
                        {career.length} {pick(locale, 'محطات تدريب', 'Stints')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.vipAvatarBox}>
                  <div className={styles.vipAvatarFrame}>
                    {portrait ? (
                      <img src={portrait} alt={name} />
                    ) : (
                      <div className={styles.vipAvatarPlaceholder}>{name.charAt(0)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Caption */}
              <div className={styles.caption}>
                <span>
                  <b>{name}</b>
                  {clubName ? ` · ${clubName}` : ''}
                </span>
                <span>{stint ? `${localizePlainName(locale, stint.club)} (${[stint.from, stint.to || pick(locale, 'الآن', 'Present')].filter(Boolean).join(' — ')})` : pick(locale, 'مدرب', 'Coach')}</span>
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
              {stint ? <span className={styles.chip}>{localizePlainName(locale, stint.club)}</span> : null}
              {coach.nationality ? <span className={styles.chip}>{localizePlainName(locale, coach.nationality)}</span> : null}
            </div>
            <h2 className={styles.programTitle}>
              {stint
                ? `${localizePlainName(locale, stint.club)} · ${[stint.from, stint.to || pick(locale, 'الآن', 'Present')].filter(Boolean).join(' — ')}`
                : name}
            </h2>
            <div className={styles.acts}>
              {club ? (
                <Link href={`/team/${club.slug}`} className={styles.go}>
                  <span>{pick(locale, 'افتح النادي الرسمي', 'Open Club Profile')}</span>
                  <ArrowUpRight size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {career.length > 0 ? (
          <aside className={styles.queue} aria-label={pick(locale, 'المسيرة والمحطات', 'Career stints')}>
            <header className={styles.queueHead}>
              <div>
                <p>{pick(locale, 'الآن على الصالة', 'On the easel')}</p>
                <h3>{pick(locale, 'قائمة المحطات', 'Career Stints')}</h3>
              </div>
              <span className={styles.shelfBadge}>{folio(career.length)}</span>
            </header>
            <ol className={styles.queueList}>
              {career.map((row: CareerStint, index) => (
                <li key={`${row.club}-${row.from || index}`}>
                  <button
                    type="button"
                    className={`${styles.queueItem}${index === active ? ` ${styles.on}` : ''}`}
                    onClick={() => setActive(index)}
                    aria-pressed={index === active}
                  >
                    <span className={styles.queueNum}>{folio(index)}</span>
                    <span className={styles.queueThumb}>
                      {row.clubLogo ? <img src={row.clubLogo} alt="" /> : <span>{row.club.charAt(0)}</span>}
                    </span>
                    <span className={styles.queueCopy}>
                      <b>{localizePlainName(locale, row.club)}</b>
                      <small>{[row.from, row.to || pick(locale, 'الآن', 'Present')].filter(Boolean).join(' · ')}</small>
                    </span>
                  </button>
                </li>
              ))}
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

      {/* ---------------- BIOGRAPHY ---------------- */}
      {coach.bio ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Sparkles size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'السيرة الذاتية والرؤية', 'Biography & Profile')}</h3>
              </div>
            </div>
          </header>
          <p className={styles.source} style={{ fontSize: '0.86rem', lineHeight: 1.8 }}>
            {coach.bio}
          </p>
        </section>
      ) : null}

      {/* ---------------- SQUAD WALL ---------------- */}
      {squad.length > 0 ? (
        <section id="hall-squad" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Users size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار قائمة لاعبي الفريق', 'Team Squad Wall')}</h3>
                <p>{pick(locale, 'قائمة اللاعبين تحت قيادة المدرب مع صورهم ومراكزهم.', 'Players under the coach with positions and portraits.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{squad.length}</span>
          </header>

          <div className={styles.grid}>
            {squad.map((row) => {
              const shot = apiSportsPlayerPhoto(row.player.slug.match(/(\d+)$/)?.[1], row.player.photoUrl);
              return (
                <Link key={row.id} href={`/player/${row.player.slug}`} className={styles.tile}>
                  <span className={styles.tileShot}>
                    {shot ? <img src={shot} alt="" /> : <span>{row.player.name.charAt(0)}</span>}
                  </span>
                  <strong>{localizePlainName(locale, row.player.name)}</strong>
                  <em>{row.player.position ? localizePlainName(locale, row.player.position) : ''}</em>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ---------------- FIXTURES WALL ---------------- */}
      {upcoming.length > 0 || recentMatches.length > 0 ? (
        <section id="hall-fixtures" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Calendar size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار مواعيد ونتائج الفريق', 'Fixtures & Results Wall')}</h3>
                <p>{pick(locale, 'المباريات القادمة والنتائج الأخيرة للنادي.', 'Recent outcomes and upcoming matches for the club.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{upcoming.length + recentMatches.length}</span>
          </header>

          <div className={styles.slips}>
            {[...upcoming, ...recentMatches].map((match) => (
              <Slip key={match.id} match={match} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- HONOURS & REPORTS ---------------- */}
      <div id="hall-trophies" className={styles.split}>
        {trophies.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Award size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'الألقاب والبطولات', 'Honours')}</h3>
                  <p>{pick(locale, 'البطولات المسجلة في مسيرة المدرب.', 'Trophies won.')}</p>
                </div>
              </div>
              <span className={styles.shelfBadge}>{trophies.length}</span>
            </header>
            <ul className={styles.people}>
              {trophies.map((trophy) => (
                <li key={trophy.id}>
                  <span>
                    <span className={styles.ghostFace}>🏆</span>
                    <div>
                      <strong>{localizePlainName(locale, trophy.title)}</strong>
                      <em>{[trophy.season, trophy.teamName].filter(Boolean).join(' · ')}</em>
                    </div>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Newspaper size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'التقارير والأخبار', 'Reports')}</h3>
                </div>
              </div>
              <span className={styles.shelfBadge}>{news.length}</span>
            </header>
            <ul className={styles.people}>
              {news.map((item) => (
                <li key={item.id}>
                  <Link href={`/news/${item.slug}`}>
                    <span className={styles.ghostFace}>N</span>
                    <div>
                      <strong>{item.title}</strong>
                      <em>{item.category}</em>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <p className={styles.source}>
        {pick(
          locale,
          'المصدر: واجهة البيانات الرياضية والصفوف المنشورة فقط.',
          'Source: sports API and published rows only.',
        )}
      </p>
    </div>
  );
}
