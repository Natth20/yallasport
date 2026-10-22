'use client';

import React from 'react';
import { Home, CalendarDays, Radio, Newspaper, Trophy } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useLiveStatus } from '@/lib/context/LiveStatusContext';
import styles from './mobile-bottom-nav.module.css';

export function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const ar = locale === 'ar';
  const { matches } = useLiveStatus();

  const liveCount = matches.filter(
    (m) => m.status === 'LIVE' || m.status === 'HALFTIME'
  ).length;

  const navItems = [
    {
      href: '/',
      label: ar ? 'الرئيسية' : 'Home',
      icon: Home,
      exact: true,
    },
    {
      href: '/matches',
      label: ar ? 'المباريات' : 'Matches',
      icon: CalendarDays,
    },
    {
      href: '/live',
      label: ar ? 'مباشر' : 'Live',
      icon: Radio,
      badge: liveCount > 0 ? liveCount : undefined,
      isLive: liveCount > 0,
    },
    {
      href: '/news',
      label: ar ? 'الأخبار' : 'News',
      icon: Newspaper,
    },
    {
      href: '/leaderboard',
      label: ar ? 'التوقعات' : 'Predict',
      icon: Trophy,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.bottomNavContainer} aria-label={ar ? 'التنقل السفلي السريع' : 'Mobile bottom navigation'}>
      <div className={styles.bottomNavInner}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navTab} ${active ? styles.tabActive : ''}`}
            >
              <div className={styles.iconWrapper}>
                <Icon className={`w-5 h-5 ${active ? styles.iconActive : styles.iconInactive}`} />
                {item.badge != null ? (
                  <span className={`${styles.liveBadge} ${item.isLive ? styles.liveBadgePulse : ''}`}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={styles.tabLabel}>{item.label}</span>
              {active ? <span className={styles.activeGlowIndicator} /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
