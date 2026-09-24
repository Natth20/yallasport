'use client';

import React, { useEffect, useState } from 'react';
import { Search, Menu, User, Sparkles } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  Button,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from '@/components/ui';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import styles from './header.module.css';

export const Header: React.FC = () => {
  const { t, dir, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: t('common.home') || 'الرئيسية', href: '/' },
    { name: t('common.matches') || 'المباريات', href: '/matches' },
    { name: t('common.leagues') || 'البطولات', href: '/leagues' },
    { name: t('common.news') || 'الأخبار', href: '/news' },
    {
      name: t('common.broadcasts') || 'البث المباشر',
      href: '/live',
      badge: 'LIVE',
    },
    { name: t('common.video') || 'الفيديوهات', href: '/videos' },
  ];

  const moreItems = [
    { name: t('common.transfers') || 'سوق الانتقالات', href: '/transfers', icon: '🔄' },
    { name: t('common.stats') || 'مركز الإحصائيات', href: '/stats', icon: '📊' },
    { name: t('common.player_compare') || 'مقارنة اللاعبين', href: '/compare-players', icon: '⚖️' },
    { name: t('common.photos') || 'ألبوم الصور', href: '/photos', icon: '📸' },
    { name: t('common.favorites') || 'المفضلة', href: '/favorites', icon: '⭐' },
    { name: t('footer.leaderboard') || 'لوحة الصدارة', href: '/leaderboard', icon: '🏆' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header
        className={`${styles.headerSticky} ${isScrolled ? styles.scrolled : ''}`}
        dir={dir}
      >
        <div className={styles.container}>
          {/* Brand Logo */}
          <Link href="/" className={styles.brandLink} aria-label="Yalla Sport">
            <BrandMark size={38} priority />
            <div className={styles.brandText}>
              <span className={styles.brandName}>
                {dir === 'rtl' ? 'يلا سبورت' : 'Yalla Sport'}
              </span>
              <span className={styles.brandTagline}>
                {language === 'ar' ? 'المنصة الرياضية الأولى' : 'Sports Hub'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
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
                  {item.badge && (
                    <Badge variant="live" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <Dropdown>
              <DropdownTrigger>
                <button
                  type="button"
                  className={styles.navItem}
                  aria-label="المزيد من الأقسام"
                >
                  <span>{t('common.more') || 'المزيد'}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
                </button>
              </DropdownTrigger>
              <DropdownMenu placement="bottom-start">
                {moreItems.map((item) => (
                  <DropdownItem
                    key={item.href}
                    icon={<span>{item.icon}</span>}
                    onClick={() => router.push(item.href)}
                  >
                    {item.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </nav>

          {/* Actions (Search, Language, Theme, Profile, Mobile Trigger) */}
          <div className={styles.actions}>
            {/* Quick Search Button */}
            <button
              type="button"
              className={styles.searchButton}
              onClick={() => router.push('/search')}
              aria-label={t('common.search') || 'بحث'}
            >
              <Search className={styles.searchIcon} />
              <span className="hidden sm:inline">{t('common.search') || 'بحث سريع...'}</span>
              <kbd className={styles.searchKbd}>⌘K</kbd>
            </button>

            {/* Toggles (Theme & Language) */}
            <div className={styles.togglesDesktop}>
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* User Auth Button */}
            <div className={styles.authDesktop}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<User className="w-4 h-4" />}
                onClick={() => router.push('/profile')}
              >
                {t('common.account') || 'حسابي'}
              </Button>
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              className={styles.mobileMenuTrigger}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={[...navItems, ...moreItems]}
      />
    </>
  );
};
