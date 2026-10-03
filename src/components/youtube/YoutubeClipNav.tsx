import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { Film, Flame, Archive, Camera } from 'lucide-react';
import styles from './youtube.module.css';

export function YoutubeClipNav({
  locale,
  current,
}: {
  locale: string;
  current: 'videos' | 'reels' | 'archive';
}) {
  const items = [
    {
      href: '/photos' as const,
      id: 'photos' as const,
      label: pick(locale, 'الصور', 'Photos'),
      icon: Camera,
      badge: pick(locale, 'إطارات', 'Prints'),
    },
    {
      href: '/videos' as const,
      id: 'videos' as const,
      label: pick(locale, 'قاعة الفيديو', 'Cinema'),
      icon: Film,
      badge: pick(locale, 'شاشة عريضة', 'Widescreen'),
    },
    {
      href: '/videos/reels' as const,
      id: 'reels' as const,
      label: pick(locale, 'ريلز كرة القدم', 'Football Reels'),
      icon: Flame,
      badge: pick(locale, 'عمودي', 'Shorts'),
    },
    {
      href: '/videos/archive' as const,
      id: 'archive' as const,
      label: pick(locale, 'خزينة الأرشيف', 'Archive Vault'),
      icon: Archive,
      badge: pick(locale, 'مؤرشف', 'Saved'),
    },
  ];

  return (
    <nav className={styles['yt-tabs']} aria-label={pick(locale, 'فيديو', 'Video')}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = current === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`${styles['yt-tab']}${active ? ` ${styles['is-on']}` : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={styles['yt-tab-icon']} aria-hidden size={15} />
            <span className={styles['yt-tab-text']}>{item.label}</span>
            <span className={styles['yt-tab-badge']}>{item.badge}</span>
          </Link>
        );
      })}
    </nav>
  );
}
