import React from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button, Input } from '@/components/ui';
import styles from './footer.module.css';

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const majorLeagues = [
    { name: locale === 'ar' ? 'دوري أبطال أوروبا' : 'UEFA Champions League', href: '/league/uefa-champions-league' },
    { name: locale === 'ar' ? 'الدوري الإنجليزي الممتاز' : 'Premier League', href: '/league/premier-league' },
    { name: locale === 'ar' ? 'الدوري الإسباني (LaLiga)' : 'La Liga', href: '/league/la-liga' },
    { name: locale === 'ar' ? 'دوري روشن السعودي' : 'Saudi Pro League', href: '/league/saudi-pro-league' },
    { name: locale === 'ar' ? 'الدوري الإيطالي (Serie A)' : 'Serie A', href: '/league/serie-a' },
  ];

  const sportsHub = [
    { name: t('common.matches') || 'المباريات المباشرة', href: '/matches' },
    { name: t('common.broadcasts') || 'البث المباشر والقنوات', href: '/live' },
    { name: t('common.leagues') || 'جميع البطولات', href: '/leagues' },
    { name: t('common.transfers') || 'سوق الانتقالات', href: '/transfers' },
    { name: t('common.stats') || 'مركز الإحصائيات', href: '/stats' },
  ];

  const mediaAndTools = [
    { name: t('common.news') || 'أخبار كرة القدم', href: '/news' },
    { name: t('common.video') || 'أرشيف الفيديوهات', href: '/videos' },
    { name: t('common.photos') || 'ألبوم الصور', href: '/photos' },
    { name: t('common.player_compare') || 'مقارنة اللاعبين', href: '/compare-players' },
    { name: t('footer.leaderboard') || 'لوحة الصدارة والتوقعات', href: '/leaderboard' },
  ];

  const aboutAndSupport = [
    { name: t('footer.about') || 'عن يلا سبورت', href: '/about' },
    { name: t('footer.connect') || 'اتصل بنا', href: '/contact' },
    { name: t('common.report') || 'الإبلاغ عن خطأ', href: '/report' },
    { name: t('common.privacy') || 'سياسة الخصوصية', href: '/privacy' },
    { name: t('common.terms') || 'شروط الاستخدام', href: '/terms' },
  ];

  const legalLinks = [
    { name: t('common.privacy') || 'الخصوصية', href: '/privacy' },
    { name: t('common.terms') || 'الشروط والأحكام', href: '/terms' },
    { name: t('common.cookies') || 'ملفات تعريف الارتباط', href: '/cookies' },
    { name: t('footer.copyright') || 'حقوق الملكية الفكرية', href: '/copyright' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.topDecor} aria-hidden="true" />

      <div className={styles.container}>
        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Brand Info */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brandLink} aria-label="Yalla Sport">
              <BrandMark size={44} />
              <div>
                <div className={styles.brandName}>
                  {locale === 'ar' ? 'يلا سبورت' : 'Yalla Sport'}
                </div>
                <div className={styles.brandTagline}>
                  {locale === 'ar' ? 'المنصة الرياضية الأولى' : 'Premier Sports Hub'}
                </div>
              </div>
            </Link>

            <p className={styles.brandDesc}>
              {locale === 'ar'
                ? 'يلا سبورت منصة رياضية عربية رائدة تقدم تغطية فورية وشاملة لمباريات كرة القدم، الجداول، النتائج المباشرة، وأحدث الأخبار العالمية والمحلية.'
                : 'Yalla Sport is a leading sports platform delivering real-time football match coverage, live scores, standings, and global sporting news.'}
            </p>

            {/* Social Media Links */}
            <div className={styles.socialRow}>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Twitter / X"
              >
                𝕏
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Instagram"
              >
                📸
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="YouTube"
              >
                ▶
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Telegram"
              >
                ✈️
              </a>
            </div>
          </div>

          {/* Column 1: Major Leagues */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>
              {locale === 'ar' ? 'البطولات الكبرى' : 'Major Leagues'}
            </h4>
            <div className={styles.linksList}>
              {majorLeagues.map((link) => (
                <Link key={link.href} href={link.href} className={styles.linkItem}>
                  <span>›</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Sports Hub */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>
              {locale === 'ar' ? 'المباريات والنتائج' : 'Live Matches'}
            </h4>
            <div className={styles.linksList}>
              {sportsHub.map((link) => (
                <Link key={link.href} href={link.href} className={styles.linkItem}>
                  <span>›</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Media & Tools */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>
              {locale === 'ar' ? 'الأخبار والوسائط' : 'News & Media'}
            </h4>
            <div className={styles.linksList}>
              {mediaAndTools.map((link) => (
                <Link key={link.href} href={link.href} className={styles.linkItem}>
                  <span>›</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Column 4: About & Support */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>
              {locale === 'ar' ? 'عن المنصة والدعم' : 'Support & Legal'}
            </h4>
            <div className={styles.linksList}>
              {aboutAndSupport.map((link) => (
                <Link key={link.href} href={link.href} className={styles.linkItem}>
                  <span>›</span>
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Row */}
        <div className={styles.newsletterSection}>
          <div className={styles.newsletterText}>
            <h4 className={styles.newsletterTitle}>
              {locale === 'ar' ? 'اشترك في النشرة البريدية الرياضية' : 'Subscribe to Sports Digest'}
            </h4>
            <p className={styles.newsletterDesc}>
              {locale === 'ar'
                ? 'احصل على ملخص يومي بأبرز الأهداف ونتائج المباريات وأحدث الأخبار في بريدك.'
                : 'Get daily match highlights, major scores, and football news directly to your inbox.'}
            </p>
          </div>
          <form className={styles.newsletterForm} onSubmit={undefined}>
            <Input
              type="email"
              placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني...' : 'Enter your email...'}
              inputSize="sm"
            />
            <Button variant="accent" size="sm">
              {locale === 'ar' ? 'اشتراك' : 'Subscribe'}
            </Button>
          </form>
        </div>

        {/* Bottom Sub-Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © {year} {locale === 'ar' ? 'يلا سبورت. جميع الحقوق محفوظة.' : 'Yalla Sport. All rights reserved.'}
          </p>

          <div className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.legalLink}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
