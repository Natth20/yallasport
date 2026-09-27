import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FrontMark } from '../FrontMark';
import styles from '../front-hall.module.css';

export async function DoorsChapter() {
  const t = await getTranslations('front');
  const doors = [
    { href: '/matches' as const, label: t('cta_matches') },
    { href: '/live' as const, label: t('cta_live') },
    { href: '/news' as const, label: t('cta_news') },
    { href: '/leagues' as const, label: t('door_leagues') },
    { href: '/videos' as const, label: t('door_videos') },
    { href: '/photos' as const, label: t('door_photos') },
    { href: '/stats' as const, label: t('door_stats') },
    { href: '/transfers' as const, label: t('door_transfers') },
    { href: '/compare-players' as const, label: t('ch05_compare_players') },
    { href: '/compare' as const, label: t('ch05_compare') },
    { href: '/leaderboard' as const, label: t('door_board') },
    { href: '/search' as const, label: t('door_search') },
    { href: '/about' as const, label: t('door_about') },
    { href: '/contact' as const, label: t('door_contact') },
    { href: '/report' as const, label: t('door_report') },
    { href: '/settings' as const, label: t('door_settings') },
    { href: '/privacy' as const, label: t('door_privacy') },
    { href: '/terms' as const, label: t('door_terms') },
    { href: '/cookies' as const, label: t('door_cookies') },
    { href: '/copyright' as const, label: t('door_copyright') },
  ];
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch12')} title={t('ch12_title')} />
      <nav className={styles.doors}>
        {doors.map((door) => (
          <Link key={door.href} href={door.href}>
            {door.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
