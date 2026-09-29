import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { Camera, Clapperboard, Newspaper } from 'lucide-react';
import styles from '@/components/youtube/youtube.module.css';

export function PhotoNav({ locale }: { locale: string }) {
  const items = [
    {
      href: '/photos' as const,
      current: true,
      label: pick(locale, 'قاعة الصور', 'Photos'),
      icon: Camera,
      badge: pick(locale, 'إطارات', 'Prints'),
    },
    {
      href: '/videos' as const,
      current: false,
      label: pick(locale, 'قاعة الفيديو', 'Cinema'),
      icon: Clapperboard,
      badge: pick(locale, 'شاشة عريضة', 'Widescreen'),
    },
    {
      href: '/news' as const,
      current: false,
      label: pick(locale, 'الأخبار', 'News'),
      icon: Newspaper,
      badge: pick(locale, 'تقارير', 'Reports'),
    },
  ];

  return (
    <nav className={styles['yt-tabs']} aria-label={pick(locale, 'الصور', 'Photos')}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles['yt-tab']}${item.current ? ` ${styles['is-on']}` : ''}`}
            aria-current={item.current ? 'page' : undefined}
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
