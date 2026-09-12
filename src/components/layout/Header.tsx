'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, Menu, Search, UserRound, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { DataSaverToggle } from './DataSaverToggle';
import { VoiceSearch } from './VoiceSearch';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BroadcastsLink } from './BroadcastsLink';
import { BrandMark } from '@/components/brand/BrandMark';
import { Link, useRouter, usePathname } from '@/i18n/navigation';

export const Header: React.FC = () => {
  const { t, dir } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navItems = [
    { name: t('common.home'), href: '/' },
    { name: t('common.news'), href: '/news' },
    { name: t('common.leagues'), href: '/leagues' },
    { name: t('common.matches'), href: '/matches' },
    { name: t('common.watch'), href: '/watch' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="site-masthead fixed inset-x-0 top-2 z-[100] px-3 sm:px-5" dir={dir}>
        <div className={`masthead-shell ${isScrolled ? 'is-scrolled' : ''}`}>
          <span className="masthead-edge" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-tl" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-tr" aria-hidden="true" />
          <span className="masthead-glow" aria-hidden="true" />

          <Link href="/" className="masthead-brand group" aria-label="Yalla Sport">
            <span className="masthead-brand-mark">
              <BrandMark size={40} priority className="transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="text-[15px] font-extrabold leading-none tracking-[-0.05em] text-foreground dark:text-foreground">
                YALLA SPORT
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.28em] text-orange-500">
                <span className="hidden h-px w-3 bg-orange-400/50 sm:block" />
                {t('footer.tagline')}
              </span>
            </span>
          </Link>

          <nav className="masthead-nav hidden lg:flex" aria-label={t('navigation.main')}>
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`masthead-link ${active ? 'is-active' : ''}`}
                >
                  <span className="masthead-link-index">0{index + 1}</span>
                  <span className="masthead-link-label">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="masthead-tools">
            <BroadcastsLink
              label={t('common.broadcasts')}
              className="masthead-live"
            />

            <form onSubmit={handleSearch} className="masthead-search hidden xl:flex">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="search"
                aria-label={t('common.search')}
                placeholder={t('navigation.search_site')}
                className="w-[7.5rem] bg-transparent text-[11px] font-medium text-foreground outline-none placeholder:text-muted-foreground transition-[width] duration-300 focus:w-40 dark:text-foreground"
              />
              <VoiceSearch
                onResult={(text) => {
                  setSearchQuery(text);
                  router.push(`/search?q=${encodeURIComponent(text)}`);
                }}
              />
            </form>

            <div className="masthead-cluster hidden md:flex">
              <DataSaverToggle />
              <ThemeToggle />
              <LanguageToggle />
            </div>

            <Link href="/login" className="masthead-login hidden sm:inline-flex">
              <UserRound className="h-3.5 w-3.5" />
              <span>{t('common.login')}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="masthead-menu-btn grid place-items-center lg:hidden"
              aria-label={t(isMobileMenuOpen ? 'navigation.close_menu' : 'navigation.open_menu')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`masthead-drawer lg:hidden ${isMobileMenuOpen ? 'is-open' : ''}`}
        dir={dir}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="masthead-drawer-veil" onClick={closeMobile} />
        <div className="masthead-drawer-sheet">
          <span className="masthead-drawer-edge" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-tl" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-tr" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-bl" aria-hidden="true" />
          <span className="masthead-corner masthead-corner-br" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full max-w-lg flex-col px-5 pb-8 pt-24">
            <div className="mb-6 flex items-end justify-between gap-3 border-b border-white/10 pb-4 dark:border-border">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400">
                  {t('footer.match_programme')}
                </p>
                <p className="mt-2 text-[13px] text-muted-foreground dark:text-foreground/45">
                  {t('navigation.drawer_lead')}
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground dark:text-foreground/30">
                {t('footer.edition')}
              </span>
            </div>

            <div className="masthead-drawer-search mb-7">
              <form onSubmit={handleSearch} className="flex flex-1 items-center">
                <Search className="mx-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  type="search"
                  placeholder={t('navigation.search_everything')}
                  className="h-11 flex-1 bg-transparent text-sm font-medium text-foreground outline-none dark:text-foreground"
                />
              </form>
              <VoiceSearch
                onResult={(text) => {
                  setSearchQuery(text);
                  closeMobile();
                  router.push(`/search?q=${encodeURIComponent(text)}`);
                }}
              />
              <DataSaverToggle />
            </div>

            <nav className="space-y-1.5" aria-label={t('navigation.mobile')}>
              {navItems.map((item, index) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`masthead-drawer-link group ${active ? 'is-active' : ''}`}
                  >
                    <span className="flex items-center gap-4">
                      <span className="tabular-nums text-[10px] font-bold tracking-[0.18em] text-muted-foreground dark:text-foreground/25">
                        0{index + 1}
                      </span>
                      <span className="text-[1.35rem] font-bold tracking-tight">{item.name}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500 dark:text-foreground/25 rtl:rotate-[-90deg]" />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3 pt-8">
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/70 px-4 py-3 dark:border-border dark:bg-card/[0.04]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground dark:text-foreground/35">
                  {t('navigation.controls')}
                </p>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
              </div>

              <BroadcastsLink
                label={t('common.broadcasts')}
                showLabel
                onNavigate={closeMobile}
                className="masthead-drawer-live"
              />

              <Link href="/login" onClick={closeMobile} className="masthead-drawer-login">
                <UserRound className="h-4 w-4" />
                {t('common.sign_in')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
