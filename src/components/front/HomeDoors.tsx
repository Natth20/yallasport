import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  Clapperboard,
  Heart,
  Images,
  Newspaper,
  Radio,
  Scale,
  Search,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import styles from './home-salon.module.css';

export async function HomeDoors() {
  const t = await getTranslations('front');
  const doors = [
    { href: '/news' as const, label: t('cta_news'), hint: t('hint_news'), Icon: Newspaper },
    { href: '/matches' as const, label: t('cta_matches'), hint: t('hint_matches'), Icon: CalendarDays },
    { href: '/live' as const, label: t('cta_live'), hint: t('hint_watch'), Icon: Radio },
    { href: '/leagues' as const, label: t('door_leagues'), hint: t('hint_leagues'), Icon: Trophy },
    { href: '/videos' as const, label: t('door_videos'), hint: t('hint_videos'), Icon: Clapperboard },
    { href: '/photos' as const, label: t('door_photos'), hint: t('hint_photos'), Icon: Images },
    { href: '/stats' as const, label: t('door_stats'), hint: t('hint_stats'), Icon: BarChart3 },
    { href: '/transfers' as const, label: t('door_transfers'), hint: t('hint_transfers'), Icon: ArrowLeftRight },
    { href: '/compare-players' as const, label: t('ch05_compare_players'), hint: t('hint_players'), Icon: Users },
    { href: '/compare' as const, label: t('ch05_compare'), hint: t('hint_players'), Icon: Shield },
    { href: '/leaderboard' as const, label: t('door_board'), hint: t('hint_board'), Icon: Scale },
    { href: '/favorites' as const, label: t('ch11_all'), hint: t('hint_favorites'), Icon: Heart },
    { href: '/search' as const, label: t('door_search'), hint: t('hint_search'), Icon: Search },
  ];

  return (
    <nav className={styles.doors} aria-label={t('foyer_label')}>
      {doors.map((door, index) => (
        <Link key={door.href} href={door.href} className={styles.door}>
          <span className={styles.doorIndex} aria-hidden>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={styles.doorIcon} aria-hidden>
            <door.Icon size={18} strokeWidth={2.2} />
          </span>
          <strong>{door.label}</strong>
          <em>{door.hint}</em>
        </Link>
      ))}
    </nav>
  );
}
