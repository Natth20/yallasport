'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button, Badge, Input } from '@/components/ui';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { DataSaverToggle } from './DataSaverToggle';
import { VoiceSearch } from './VoiceSearch';
import styles from './mobile-menu.module.css';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: Array<{ name: string; href: string; badge?: string }>;
  moreGroups?: Array<{ label: string; items: Array<{ name: string; href: string }> }>;
  desk?: React.ReactNode;
  onSearch?: () => void;
  onVoiceSearch?: (query: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navItems,
  moreGroups = [],
  desk,
  onSearch,
  onVoiceSearch,
}) => {
  const { t, dir, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const renderLink = (item: { name: string; href: string; badge?: string }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`${styles.navLink} ${active ? styles.active : ''}`}
      >
        <span className={styles.navLabel}>{item.name}</span>
        {item.badge && (
          <Badge variant={item.href === '/live' ? 'live' : 'accent'} size="sm">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const menuContent = (
    <div className={styles.drawerOverlay} dir={dir}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <Link href="/" className={styles.brandLink} onClick={onClose} aria-label="Yalla Sport">
            <BrandMark size={36} />
          </Link>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.searchBox}>
          {onSearch ? (
            <div className={styles.searchRow}>
              <button type="button" className={styles.searchLaunch} onClick={onSearch}>
                <Search className="h-4 w-4" />
                <span>{language === 'ar' ? 'ابحث في المصدر…' : 'Search the source…'}</span>
              </button>
              <VoiceSearch
                onResult={(text) => {
                  if (onVoiceSearch) {
                    onVoiceSearch(text);
                  } else if (onSearch) {
                    onSearch();
                  }
                }}
                className={styles.menuVoice}
              />
            </div>
          ) : (
            <div className={styles.searchRow}>
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <Input
                  placeholder={t('common.search') || 'بحث عن مباراة، فريق، لاعب...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 w-4" />}
                  inputSize="sm"
                />
              </form>
              <VoiceSearch
                onResult={(text) => {
                  setSearchQuery(text);
                  router.push(`/search?q=${encodeURIComponent(text)}`);
                  onClose();
                }}
                className={styles.menuVoice}
              />
            </div>
          )}
        </div>

        <nav className={styles.navList}>
          <Link
            href="/"
            onClick={onClose}
            className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
          >
            <span className={styles.navLabel}>{language === 'ar' ? '🏠 الرئيسية' : '🏠 Home'}</span>
          </Link>

          {moreGroups.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group.label}</p>
              {group.items.map(renderLink)}
            </div>
          ))}

          {desk ? (
            <div className={styles.navGroup} onClick={onClose}>
              <p className={styles.navGroupLabel}>{language === 'ar' ? 'المكتب' : 'Desk'}</p>
              {desk}
            </div>
          ) : null}

          {/* Quick legal/about section at bottom of menu */}
          <div className={styles.navGroup}>
            <p className={styles.navGroupLabel}>{language === 'ar' ? 'عن يلا سبورت' : 'About Platform'}</p>
            <Link href="/about" onClick={onClose} className={styles.navLink}>
              <span className={styles.navLabel}>{language === 'ar' ? 'ℹ️ من نحن' : 'ℹ️ About Us'}</span>
            </Link>
            <Link href="/contact" onClick={onClose} className={styles.navLink}>
              <span className={styles.navLabel}>{language === 'ar' ? '📩 تواصل معنا' : '📩 Contact Us'}</span>
            </Link>
            <Link href="/report" onClick={onClose} className={styles.navLink}>
              <span className={styles.navLabel}>{language === 'ar' ? '🚩 إبلاغ عن محتوى' : '🚩 Report Content'}</span>
            </Link>
            <Link href="/privacy" onClick={onClose} className={styles.navLink}>
              <span className={styles.navLabel}>{language === 'ar' ? '🔒 سياسة الخصوصية' : '🔒 Privacy Policy'}</span>
            </Link>
          </div>
        </nav>

        <div className={styles.drawerFooter}>
          <div className={styles.togglesRow}>
            <LanguageToggle />
            <ThemeToggle />
            <DataSaverToggle />
          </div>

          <div className={styles.authButtons}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                router.push('/login');
                onClose();
              }}
            >
              {t('common.login') || 'تسجيل الدخول'}
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                router.push('/register');
                onClose();
              }}
            >
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(menuContent, document.body);
  }
  return null;
};
