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
import { VoiceSearch } from './VoiceSearch';
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
  const [seekQuery, setSeekQuery] = useState('');
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
    { name: t('common.news') || 'الأخبار', href: '/news' },
    { name: t('common.matches') || 'المباريات', href: '/matches' },
    { name: t('common.leagues') || 'البطولات', href: '/leagues' },
    { name: t('common.video') || 'الفيديو', href: '/videos' },
    { name: t('common.stats') || 'الإحصائيات', href: '/stats' },
    { name: t('common.broadcasts') || 'يلا سبورت مباشر', href: '/live', badge: 'LIVE' },
  ];

  const moreGroups: NavGroup[] = [
    {
      label: ar ? 'المجموعة الأولى — المحتوى' : 'Group 1 — Content',
      items: [
        { name: ar ? '📰 الأخبار' : '📰 News', href: '/news' },
        { name: ar ? '🎥 الفيديو' : '🎥 Videos', href: '/videos' },
        { name: ar ? '🎬 الريلز' : '🎬 Reels', href: '/reels', badge: 'HOT' },
        { name: ar ? '📷 الصور' : '📷 Photos', href: '/photos' },
        { name: ar ? '🔄 الانتقالات' : '🔄 Transfers', href: '/transfers' },
      ],
    },
    {
      label: ar ? 'المجموعة الثانية — الرياضة' : 'Group 2 — Sports',
      items: [
        { name: ar ? '🏟️ المباريات' : '🏟️ Matches', href: '/matches' },
        { name: ar ? '🏆 البطولات' : '🏆 Tournaments', href: '/leagues' },
        { name: ar ? '👥 الفرق' : '👥 Teams', href: '/teams' },
        { name: ar ? '👤 اللاعبون' : '👤 Players', href: '/players' },
        { name: ar ? '🧑‍💼 المدربون' : '🧑‍💼 Coaches', href: '/coaches' },
        { name: ar ? '📺 القنوات الناقلة' : '📺 TV Channels', href: '/channels' },
        { name: ar ? '📺 يلا سبورت مباشر' : '📺 Yalla Sport Live', href: '/live', badge: 'LIVE' },
      ],
    },
    {
      label: ar ? 'المجموعة الثالثة — الإحصائيات والتفاعل' : 'Group 3 — Stats & Interaction',
      items: [
        { name: ar ? '📊 مركز الإحصائيات' : '📊 Stats Center', href: '/stats' },
        { name: ar ? 'الأحداث' : 'Events', href: '/events' },
        { name: ar ? '⚖️ مقارنة اللاعبين' : '⚖️ Compare Players', href: '/compare-players' },
        { name: ar ? '🆚 مقارنة الأندية' : '🆚 Compare Clubs', href: '/compare' },
        { name: ar ? '🏆 لوحة الصدارة والتوقعات' : '🏆 Leaderboard', href: '/leaderboard' },
        { name: ar ? '📱 مركز التواصل الاجتماعي' : '📱 Social Hub', href: '/social' },
      ],
    },
    {
      label: ar ? 'المجموعة الرابعة — الحساب والخدمات' : 'Group 4 — Account & Services',
      items: [
        { name: ar ? '⭐ المفضلة' : '⭐ Favorites', href: '/favorites' },
        { name: ar ? '🔔 تابع فريقك' : '🔔 Follow Your Team', href: '/follow' },
        { name: ar ? '👤 حسابي' : '👤 My Account', href: '/profile' },
        { name: ar ? '⚙️ الإعدادات' : '⚙️ Settings', href: '/settings' },
        { name: ar ? '📱 تطبيق يلا سبورت' : '📱 Yalla Sport App', href: '/app' },
      ],
    },
  ];

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
              <BrandMark size={38} priority />
            </Link>

            <nav className={styles.desktopNav} aria-label={t('navigation.main') || 'القائمة الرئيسية'}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={`nav-${item.href}`}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                  >
                    <span>{item.name}</span>
                    {item.badge ? (
                      <span className={styles.liveBadge} title="مباشر">
                        <span className={styles.liveDot} aria-hidden />
                      </span>
                    ) : null}
                  </Link>
                );
              })}
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className={styles.navItem}
                    aria-label={ar ? 'أقسام الموقع' : 'More sections'}
                  >
                    <span>{ar ? 'المجموعات' : 'Groups'}</span>
                    <span className={styles.dropdownCaret}>▾</span>
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  placement={dir === 'rtl' ? 'bottom-end' : 'bottom-start'}
                  className={styles.megaMenu}
                >
                  {moreGroups.map((group) => (
                    <DropdownGroup key={group.label} label={group.label}>
                      {group.items.map((item) => (
                        <DropdownLink key={item.href} href={item.href}>
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
              <VoiceSearch
                onResult={(text) => {
                  setSeekQuery(text);
                  setSeekOpen(true);
                }}
                className={styles.headerVoice}
              />
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
        onVoiceSearch={(query) => {
          setIsMobileMenuOpen(false);
          setSeekQuery(query);
          setSeekOpen(true);
        }}
      />
      <HeaderSeek
        open={seekOpen}
        onClose={() => {
          setSeekOpen(false);
          setSeekQuery('');
        }}
        locale={language}
        initialQuery={seekQuery}
      />
    </>
  );
};
