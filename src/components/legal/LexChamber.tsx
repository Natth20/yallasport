'use client';

import { useState, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { LexProgress, LexRail, type LexRailItem } from './LexRail';
import styles from './lex.module.css';
import {
  ShieldCheck,
  Cookie,
  FileText,
  Scale,
  AlertTriangle,
  Search,
  Share2,
  Printer,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Send,
  ExternalLink,
} from 'lucide-react';

export const LEX_GATES = [
  {
    href: '/privacy',
    code: '01',
    tone: 'vault',
    ar: 'سياسة الخصوصية',
    en: 'Privacy Policy',
    arDesc: 'حماية بياناتك وخيارات الخصوصية',
    enDesc: 'Data protection and privacy choices',
    icon: ShieldCheck,
  },
  {
    href: '/cookies',
    code: '02',
    tone: 'crumb',
    ar: 'ملفات تعريف الارتباط',
    en: 'Cookie Policy',
    arDesc: 'الملفات الفنية وجلسات التصفح',
    enDesc: 'Technical cookies and sessions',
    icon: Cookie,
  },
  {
    href: '/terms',
    code: '03',
    tone: 'deed',
    ar: 'شروط الاستخدام',
    en: 'Terms of Service',
    arDesc: 'ميثاق الاستخدام وحقوق المنصة',
    enDesc: 'Platform charter and user rights',
    icon: FileText,
  },
  {
    href: '/copyright',
    code: '04',
    tone: 'mark',
    ar: 'حقوق الملكية والنشر',
    en: 'Copyright & DMCA',
    arDesc: 'حماية الملكية الفكرية وشعارات الأندية',
    enDesc: 'Intellectual property and crests',
    icon: Scale,
  },
  {
    href: '/report',
    code: '05',
    tone: 'desk',
    ar: 'مركز الإبلاغ والدعم',
    en: 'Report Center',
    arDesc: 'الإبلاغ عن أخطاء أو انتهاكات حقوق',
    enDesc: 'Report errors or copyright issues',
    icon: AlertTriangle,
  },
] as const;

export type LexTone = (typeof LEX_GATES)[number]['tone'];

export function LexChamber({
  locale,
  path,
  tone,
  code,
  instrument,
  title,
  wordmark,
  eyebrow,
  lead,
  date,
  seals,
  rail,
  children,
  aside,
}: {
  locale: string;
  path: string;
  tone: LexTone;
  code: string;
  instrument: string;
  title: string;
  wordmark: string;
  eyebrow: string;
  lead: string;
  date: string;
  seals: string[];
  rail: LexRailItem[];
  children: ReactNode;
  aside?: ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const isAr = locale === 'ar';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: lead,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(window.location.href);
      alert(isAr ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard');
    }
  };

  return (
    <div className={styles['lex-chamber']} data-lex-tone={tone}>
      <span className={styles['lex-bg-glow']} aria-hidden />
      <span className={styles['lex-bg-grid']} aria-hidden />
      <LexProgress />

      <div className={styles['lex-container']}>
        {/* ——— Hero Header ——— */}
        <header className={styles['lex-hero']}>
          <div className={styles['lex-hero-badge-row']}>
            <span className={styles['lex-pill-badge']}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{instrument}</span>
            </span>
            <span className={styles['lex-meta-badge']}>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isAr ? `تاريخ السريان: ${date}` : `Effective: ${date}`}</span>
            </span>
            <span className={`${styles['lex-meta-badge']} font-mono`}>
              <span>{code}</span>
            </span>
          </div>

          <h1 className={styles['lex-hero-title']}>{wordmark}</h1>
          <p className={styles['lex-hero-lead']}>{lead}</p>

          {/* Quick Action Toolbar */}
          <div className={styles['lex-hero-actions']}>
            <div className={styles['lex-search-box']}>
              <Search className={`${styles['lex-search-icon']} w-4 h-4`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث في بنود هذه الوثيقة...' : 'Search within this document...'}
                className={styles['lex-search-input']}
              />
            </div>

            <div className={styles['lex-tool-btns']}>
              <button
                type="button"
                onClick={handleShare}
                className={styles['lex-tool-btn']}
                title={isAr ? 'مشاركة الرابط' : 'Share link'}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مشاركة' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className={styles['lex-tool-btn']}
                title={isAr ? 'طباعة الوثيقة' : 'Print document'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة' : 'Print'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ——— Hub Navigation Ribbon ——— */}
        <nav
          className={styles['lex-nav-ribbon']}
          aria-label={pick(locale, 'بوابة الوثائق القانونية', 'Legal & Trust Portal')}
        >
          {LEX_GATES.map((gate) => {
            const active = gate.href === path;
            const Icon = gate.icon;
            return (
              <Link
                key={gate.href}
                href={gate.href}
                className={styles['lex-nav-card']}
                data-active={active ? 'true' : 'false'}
              >
                <div className={styles['lex-nav-card-icon']}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={styles['lex-nav-card-text']}>
                  <span className={styles['lex-nav-card-title']}>{pick(locale, gate.ar, gate.en)}</span>
                  <span className={styles['lex-nav-card-desc']}>{pick(locale, gate.arDesc, gate.enDesc)}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ——— Main Content Layout ——— */}
        <div className={styles['lex-main-grid']}>
          {/* Sticky Sidebar (Table of Contents & Quick Support) */}
          <aside className={styles['lex-sidebar']}>
            <LexRail
              items={rail}
              heading={pick(locale, 'فهرس البنود', 'Article Index')}
              readLabel={pick(locale, 'العودة للأعلى', 'Back to top')}
            />

            {aside || (
              <div className={styles['lex-sidebar-contact-card']}>
                <h4>{pick(locale, 'هل لديك استفسار؟', 'Have questions?')}</h4>
                <p>
                  {pick(
                    locale,
                    'فريق يلا سبورت جاهز للإجابة على أي تساؤل يتعلق بالخصوصية والشروط.',
                    'Our team is available to address any privacy or terms concerns.'
                  )}
                </p>
                <Link href="/report" className={styles['lex-sidebar-btn']}>
                  <Send className="w-3.5 h-3.5" />
                  <span>{pick(locale, 'تواصل مع الدعم', 'Contact Support')}</span>
                </Link>
              </div>
            )}
          </aside>

          {/* Main Document Content */}
          <main className={styles['lex-articles-flow']} id="lex-doc-content">
            {children}
          </main>
        </div>

        {/* ——— Footer Colophon ——— */}
        <footer className={styles['lex-colophon-box']}>
          <div className={styles['lex-colophon-info']}>
            <div className="w-10 h-10 rounded-xl bg-[var(--lex-accent-soft)] border border-[var(--lex-accent-border)] flex items-center justify-center text-[var(--lex-accent)] font-bold text-sm">
              YS
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">YALLA SPORT TRUST & LEGAL</p>
              <p className="text-xs text-muted-foreground font-mono">
                {code} · {date}
              </p>
            </div>
          </div>

          <p className={styles['lex-colophon-legal-text']}>
            {pick(
              locale,
              'تخضع هذه الوثيقة لمراجعة دورية لضمان الامتثال التام لأعلى معايير حماية البيانات والشفافية الرقمية.',
              'This document is periodically reviewed to ensure complete adherence to digital trust and data privacy standards.'
            )}
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground transition-colors border border-border"
          >
            <span>{CONTACT_EMAIL}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </footer>
      </div>
    </div>
  );
}

/* ══════════════ SUBCOMPONENTS ══════════════ */

export function LexHighlightsGrid({ children }: { children: ReactNode }) {
  return <div className={styles['lex-highlights-grid']}>{children}</div>;
}

export function LexHighlightCard({
  icon: Icon,
  badge,
  title,
  body,
}: {
  icon?: any;
  badge?: string;
  title: string;
  body: string;
}) {
  return (
    <div className={styles['lex-highlight-card']}>
      <div className={styles['lex-highlight-header']}>
        <div className={styles['lex-highlight-icon-wrap']}>
          {Icon ? <Icon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
        {badge ? <span className={styles['lex-highlight-badge']}>{badge}</span> : null}
      </div>
      <h3 className={styles['lex-highlight-title']}>{title}</h3>
      <p className={styles['lex-highlight-body']}>{body}</p>
    </div>
  );
}

export function LexSection({
  id,
  index,
  title,
  kicker,
  children,
  defaultOpen = true,
}: {
  id: string;
  index: string;
  title: string;
  kicker?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section id={id} className={styles['lex-section-card']} data-open={isOpen ? 'true' : 'false'}>
      <div className={styles['lex-section-head']} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles['lex-section-title-wrap']}>
          <span className={styles['lex-section-no']}>{index}</span>
          <div>
            {kicker ? <span className={styles['lex-section-kicker']}>{kicker}</span> : null}
            <h2 className={styles['lex-section-title']}>{title}</h2>
          </div>
        </div>
        <ChevronDown className={`${styles['lex-section-toggle-icon']} w-5 h-5`} />
      </div>

      {isOpen && <div className={styles['lex-section-body']}>{children}</div>}
    </section>
  );
}

export function LexModernTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | ReactNode)[][];
}) {
  return (
    <div className={styles['lex-table-container']}>
      <table className={styles['lex-modern-table']}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LexCheckList({ items }: { items: string[] }) {
  return (
    <ul className={styles['lex-check-list']}>
      {items.map((item, idx) => (
        <li key={idx} className={styles['lex-check-item']}>
          <CheckCircle2 className={`${styles['lex-check-icon']} w-4 h-4`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LexCallout({
  icon: Icon = Info,
  title,
  children,
}: {
  icon?: any;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={styles['lex-callout']}>
      <Icon className={`${styles['lex-callout-icon']} w-5 h-5`} />
      <div className={styles['lex-callout-content']}>
        {title ? <h4 className={styles['lex-callout-title']}>{title}</h4> : null}
        <div>{children}</div>
      </div>
    </aside>
  );
}

/* Backward compatibility helpers if needed */
export const LexArticle = LexSection;
export const LexTable = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <LexModernTable headers={head} rows={rows} />
);
export const LexPoints = ({ items }: { items: string[] }) => <LexCheckList items={items} />;
export const LexNote = ({ label, children }: { label: string; children: ReactNode }) => (
  <LexCallout title={label}>{children}</LexCallout>
);
export const LexAsideCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className={styles['lex-sidebar-contact-card']}>
    <h4>{title}</h4>
    <div>{children}</div>
  </div>
);
