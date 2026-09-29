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
import styles from './mobile-menu.module.css';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: Array<{ name: string; href: string; badge?: string }>;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, navItems }) => {
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

  const menuContent = (
    <div className={styles.drawerOverlay} dir={dir}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <Link href="/" className={styles.brandLink} onClick={onClose} aria-label="Yalla Sport">
            <BrandMark size={36} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>
                {dir === 'rtl' ? 'يلا سبورت' : 'Yalla Sport'}
              </span>
              <span className={styles.brandTagline}>
                {language === 'ar' ? 'المنصة الرياضية الأولى' : 'Premier Sports Hub'}
              </span>
            </div>
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

        {/* Search */}
        <div className={styles.searchBox}>
          <form onSubmit={handleSearchSubmit}>
            <Input
              placeholder={t('common.search') || 'بحث عن مباراة، فريق، لاعب...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              inputSize="sm"
            />
          </form>
        </div>

        {/* Navigation List */}
        <nav className={styles.navList}>
          {navItems.map((item) => {
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
          })}
        </nav>

        {/* Footer & Actions */}
        <div className={styles.drawerFooter}>
          <div className={styles.togglesRow}>
            <LanguageToggle />
            <ThemeToggle />
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
              {t('common.register') || 'إنشاء حساب جديد'}
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
