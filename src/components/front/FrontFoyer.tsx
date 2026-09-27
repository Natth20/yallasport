import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import shell from './front-shell.module.css';
import styles from './foyer.module.css';

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export async function FrontFoyer() {
  const t = await getTranslations('front');
  const doors = [
    { href: '/news' as const, label: t('cta_news'), hint: t('hint_news'), d: 'M4 6h16M4 12h16M4 18h10', live: false },
    { href: '/matches' as const, label: t('cta_matches'), hint: t('hint_matches'), d: 'M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', live: false },
    { href: '/matches' as const, label: t('stat_live'), hint: t('hint_results'), d: 'M13 10V3L4 14h7v7l9-11h-7z', live: true },
    { href: '/live' as const, label: t('cta_live'), hint: t('hint_watch'), d: 'M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z', live: false },
    { href: '/leagues' as const, label: t('door_leagues'), hint: t('hint_leagues'), d: 'M8 21h8M12 17v4M7 4h10l1 5a6 6 0 1 1-12 0L7 4z', live: false },
    { href: '/videos' as const, label: t('door_videos'), hint: t('hint_videos'), d: 'M5 4l14 8-14 8V4z', live: false },
    { href: '/stats' as const, label: t('door_stats'), hint: t('hint_stats'), d: 'M4 19V9m6 10V5m6 14v-7m6 7V3', live: false },
    { href: '/compare-players' as const, label: t('ch05_compare_players'), hint: t('hint_players'), d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6M23 11h-6M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', live: false },
  ];

  return (
    <nav className={`${shell.band} ${styles.tone}`} aria-label={t('foyer_label')}>
      <div className={shell.inner}>
        <div className={styles.grid}>
        {doors.map((door) => (
          <Link key={`${door.href}-${door.label}`} href={door.href} className={`${styles.door}${door.live ? ` ${styles.live}` : ''}`}>
            <span className={styles.mark}>
              <Icon d={door.d} />
            </span>
            <strong>{door.label}</strong>
            <em>{door.hint}</em>
          </Link>
        ))}
        </div>
      </div>
    </nav>
  );
}
