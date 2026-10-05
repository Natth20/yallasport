'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import styles from './front-design.module.css';

type LeagueView = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  standings: Array<{ rank: number; team: string; logoUrl: string | null; played: number; points: number }>;
  match: { id: string; home: string; away: string; kickoffAt: string; score: string | null } | null;
  news: Array<{ slug: string; title: string; publishedAt: string }>;
};

export function FrontMajorLeaguesClient({ locale, leagues }: { locale: string; leagues: LeagueView[] }) {
  const ar = locale === 'ar';
  const [selected, setSelected] = useState(0);
  const active = leagues[selected];
  if (!active) return null;

  return (
    <section className={`${styles.leaguesSection} ${styles.level2}`}>
      <div className={styles.sectionHeaderRow}>
        <h3 className={styles.sectionTitle}>
          <span>🏆</span>
          {ar ? 'أبرز البطولات' : 'Featured leagues'}
        </h3>
        <Link href={`/league/${active.slug}`} className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          {ar ? `مركز ${active.name} ←` : `${active.name} center →`}
        </Link>
      </div>
      <div className={styles.leaguesTabsRow}>
        {leagues.map((league, index) => (
          <button
            key={league.id}
            type="button"
            onClick={() => setSelected(index)}
            className={`${styles.leaguePillCard} ${selected === index ? styles.leaguePillActive : ''}`}
          >
            <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-5 w-5" />
            <span>{league.name}</span>
          </button>
        ))}
      </div>
      <div className={styles.leagueInteractiveGrid}>
        <div className={styles.standingsTop5Box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e27227' }}>
              {ar ? 'الترتيب (أفضل 5)' : 'Top 5 standings'}
            </span>
            <Link href={`/league/${active.slug}`} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              {ar ? 'الترتيب الكامل ←' : 'Full table →'}
            </Link>
          </div>
          <table className={styles.standingsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>{ar ? 'الفريق' : 'Team'}</th>
                <th style={{ textAlign: 'center' }}>{ar ? 'لعب' : 'P'}</th>
                <th style={{ textAlign: 'center' }}>{ar ? 'نقاط' : 'Pts'}</th>
              </tr>
            </thead>
            <tbody>
              {active.standings.map((row) => (
                <tr key={row.team}>
                  <td style={{ color: '#e27227', fontWeight: 800 }}>{row.rank}</td>
                  <td>
                    <div className={styles.teamCell}>
                      <LeagueCrest name={row.team} logoUrl={row.logoUrl} className="h-4 w-4" />
                      <span>{row.team}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{row.played}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {active.match ? (
            <Link href={`/match/${active.match.id}`} className={styles.keyMatch}>
              <span>{ar ? 'أهم مباراة' : 'Key match'}</span>
              <strong>
                {active.match.home} × {active.match.away}
              </strong>
              <em>
                {active.match.score || <ClientTime value={active.match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />}
              </em>
            </Link>
          ) : (
            <p className={styles.emptyNote}>{ar ? 'لا مباراة بارزة اليوم في هذه البطولة.' : 'No featured match today in this league.'}</p>
          )}
          <div className={styles.leagueNewsGrid}>
            {active.news.slice(0, 4).map((story) => (
              <Link key={story.slug} href={`/news/${story.slug}`} className={styles.leagueNewsCard}>
                <h5>{story.title}</h5>
                <ClientTime value={story.publishedAt} locale={locale} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
