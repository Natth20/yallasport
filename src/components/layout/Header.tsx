'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Search, User } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  Dropdown,
  DropdownGroup,
  DropdownLink,
  DropdownMenu,
  DropdownTrigger,
} from '@/components/ui';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { DataSaverToggle } from './DataSaverToggle';
import { MobileMenu } from './MobileMenu';
import { HeaderSeek } from './HeaderSeek';
import { ClientTime } from '@/components/datetime/ClientTime';
import styles from './header.module.css';

type NavLink = { name: string; href: string; badge?: string };
type NavGroup = { label: string; items: NavLink[] };

export const Header: React.FC<{ desk?: React.ReactNode }> = ({ desk }) => {
  const { t, dir, language } = useLanguage();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [seekOpen, setSeekOpen] = useState(false);
  const [deskNow, setDeskNow] = useState<Date | null>(null);
  const ar = language === 'ar';

  useEffect(() => {
    setDeskNow(new Date());
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSeekOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navItems: NavLink[] = [
    { name: t('common.home') || 'الرئيسية', href: '/' },
    { name: t('common.matches') || 'المباريات', href: '/matches' },
    { name: t('common.leagues') || 'البطولات', href: '/leagues' },
    { name: t('common.news') || 'الأخبار', href: '/news' },
    { name: t('common.broadcasts') || 'البث المباشر', href: '/live', badge: ar ? 'مباشر' : 'LIVE' },
    { name: t('common.video') || 'الفيديوهات', href: '/videos' },
  ];

  const moreGroups: NavGroup[] = [
    {
      label: ar ? 'الملعب' : 'Pitch',
      items: [
        { name: t('common.transfers') || 'سوق الانتقالات', href: '/transfers' },
        { name: t('common.stats') || 'مركز الإحصائيات', href: '/stats' },
        { name: t('common.club_compare') || 'مقارنة الأندية', href: '/compare' },
        { name: t('common.player_compare') || 'مقارنة اللاعبين', href: '/compare-players' },
      ],
    },
    {
      label: ar ? 'المعرض' : 'Gallery',
      items: [{ name: t('common.photos') || 'ألبوم الصور', href: '/photos' }],
    },
    {
      label: ar ? 'المكتب' : 'Desk',
      items: [
        { name: t('common.favorites') || 'المفضلة', href: '/favorites' },
        { name: t('footer.leaderboard') || 'لوحة الصدارة', href: '/leaderboard' },
        { name: t('common.settings') || 'الإعدادات', href: '/settings' },
      ],
    },
  ];

  const moreItems = moreGroups.flatMap((group) => group.items);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <div className={styles.shell} dir={dir}>
        <div className={styles.filament} aria-hidden />

        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
          <div className={styles.ticker}>
            <span className={styles.tickerPulse}>
              <span className={styles.liveDot} />
              {ar ? 'مكتب التغطية' : 'Coverage desk'}
            </span>
            <span className={styles.tickerRule} aria-hidden />
            {deskNow ? (
              <ClientTime
                value={deskNow}
                locale={language}
                className={styles.tickerDate}
                options={{ weekday: 'short', day: 'numeric', month: 'short' }}
              />
            ) : (
              <span className={styles.tickerDate}>—</span>
            )}
            <span className={styles.tickerRule} aria-hidden />
            <span className={styles.tickerSeal}>
              {ar ? 'من المصدر — بدون اختراع نتائج' : 'From the source — no invented scores'}
            </span>
          </div>
          <div className={styles.container}>
            <Link href="/" className={styles.brandLink} aria-label="Yalla Sport" suppressHydrationWarning>
              <span className={styles.seal} suppressHydrationWarning>
                <span className={styles.orbitRing} aria-hidden />
                <BrandMark size={34} priority />
              </span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>
                  {dir === 'rtl' ? (
                    <>
                      <span className={styles.brandAccent}>يلا</span> سبورت
                    </>
                  ) : (
                    <>
                      <span className={styles.brandAccent}>Yalla</span> Sport
                    </>
                  )}
                </span>
                <span className={styles.brandMark} aria-hidden />
              </span>
            </Link>

            <nav className={styles.desktopNav} aria-label={t('navigation.main') || 'القائمة الرئيسية'}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                  >
                    <span>{item.name}</span>
                    {item.badge ? (
                      <span className={styles.livePill}>
                        <span className={styles.liveDot} aria-hidden />
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}

              <Dropdown>
                <DropdownTrigger
                  className={`${styles.navItem} ${moreItems.some((item) => isActive(item.href)) ? styles.active : ''}`}
                  aria-label={ar ? 'المزيد' : 'More'}
                >
                  {ar ? 'المزيد' : 'More'}
                </DropdownTrigger>
                <DropdownMenu placement="bottom-start" className={styles.moreMenu}>
                  {moreGroups.map((group) => (
                    <DropdownGroup key={group.label} label={group.label}>
                      {group.items.map((item) => (
                        <DropdownLink
                          key={item.href}
                          href={item.href}
                          className={isActive(item.href) ? styles.moreActive : undefined}
                        >
                          {item.name}
                        </DropdownLink>
                      ))}
                    </DropdownGroup>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </nav>

            <div className={styles.tray}>
              <button
                type="button"
                className={styles.searchChip}
                onClick={() => setSeekOpen(true)}
                aria-label={ar ? 'بحث' : 'Search'}
              >
                <Search className={styles.searchIcon} />
                <span>{ar ? 'ابحث' : 'Search'}</span>
                <kbd>⌘K</kbd>
              </button>
              <div className={styles.togglesDesktop}>
                <LanguageToggle />
                <ThemeToggle />
                <DataSaverToggle />
              </div>
              {desk}
              <Link href="/profile" className={styles.accountButton}>
                <User className={styles.accountIcon} />
                <span>{ar ? 'حسابي' : 'Account'}</span>
              </Link>
              <button
                type="button"
                className={styles.mobileMenuTrigger}
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={ar ? 'فتح القائمة الرئيسية' : 'Open menu'}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        moreGroups={moreGroups}
        desk={desk}
        onSearch={() => {
          setIsMobileMenuOpen(false);
          setSeekOpen(true);
        }}
      />
      <HeaderSeek open={seekOpen} onClose={() => setSeekOpen(false)} locale={language} />
    </>
  );
};
