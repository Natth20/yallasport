'use client';

import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
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
  X,
} from 'lucide-react';

type LexSearchValue = {
  query: string;
  report: (id: string, match: boolean) => void;
};

const LexSearchContext = createContext<LexSearchValue>({
  query: '',
  report: () => undefined,
});

function collectText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    const bits: string[] = [];
    for (const key of ['title', 'body', 'label', 'badge'] as const) {
      if (typeof props[key] === 'string') bits.push(props[key] as string);
    }
    if (Array.isArray(props.items)) {
      bits.push(...props.items.filter((item): item is string => typeof item === 'string'));
    }
    if (Array.isArray(props.headers)) {
      bits.push(...props.headers.filter((item): item is string => typeof item === 'string'));
    }
    if (Array.isArray(props.rows)) {
      for (const row of props.rows) {
        if (Array.isArray(row)) bits.push(collectText(row));
        else bits.push(collectText(row as ReactNode));
      }
    }
    if ('children' in props) bits.push(collectText(props.children as ReactNode));
    return bits.join(' ');
  }
  return '';
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let i = lower.indexOf(needle, start);
  let key = 0;
  while (i !== -1) {
    if (i > start) parts.push(text.slice(start, i));
    parts.push(
      <mark key={key} className={styles['lex-mark']}>
        {text.slice(i, i + q.length)}
      </mark>,
    );
    key += 1;
    start = i + q.length;
    i = lower.indexOf(needle, start);
  }
  if (start < text.length) parts.push(text.slice(start));
  return <>{parts}</>;
}

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
  eyebrow: _eyebrow,
  lead,
  date,
  seals: _seals,
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
  date?: string;
  seals: string[];
  rail: LexRailItem[];
  children: ReactNode;
  aside?: ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const isAr = locale === 'ar';
  const q = searchQuery.trim();

  const report = useCallback((id: string, match: boolean) => {
    setMatched((prev) => (prev[id] === match ? prev : { ...prev, [id]: match }));
  }, []);

  const searchValue = useMemo(() => ({ query: q, report }), [q, report]);

  const hitIds = useMemo(
    () => Object.entries(matched).filter(([, hit]) => hit).map(([id]) => id),
    [matched],
  );
  const hitCount = hitIds.length;
  const knownCount = Object.keys(matched).length;
  const searchEmpty = q.length > 0 && knownCount > 0 && hitCount === 0;
  const visibleRail =
    q.length === 0
      ? rail
      : rail.filter(
        (item) =>
          hitIds.includes(item.id) || item.label.toLowerCase().includes(q.toLowerCase()),
      );

  const jumpFirst = () => {
    const first = hitIds[0] || visibleRail[0]?.id;
    if (!first) return;
    document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <LexSearchContext.Provider value={searchValue}>
      <SalonStage
        tone="deed"
        wide
        compact
        kicker={instrument}
        title={title}
        lead={lead}
        aside={code}
        tools={
          <HallFoyer
            label={pick(locale, 'جناح الوثائق', 'Legal suite')}
            items={LEX_GATES.map((gate) => ({
              href: gate.href,
              label: pick(locale, gate.ar, gate.en),
              icon: gate.icon,
              current: gate.href === path,
            }))}
          />
        }
      >
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
                {date ? (
                  <span className={styles['lex-meta-badge']}>
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isAr ? `سريان ${date}` : `Effective ${date}`}</span>
                  </span>
                ) : null}
                <span className={`${styles['lex-meta-badge']} font-mono`}>
                  <span>{code}</span>
                </span>
              </div>

              <div className={styles['lex-hero-actions']}>
                <div className={styles['lex-search-box']}>
                  <Search className={`${styles['lex-search-icon']} w-4 h-4`} />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        jumpFirst();
                      }
                      if (e.key === 'Escape') setSearchQuery('');
                    }}
                    placeholder={isAr ? 'ابحث في بنود هذه الوثيقة...' : 'Search within this document...'}
                    className={styles['lex-search-input']}
                    aria-label={isAr ? 'البحث في البنود' : 'Search clauses'}
                  />
                  {q ? (
                    <button
                      type="button"
                      className={styles['lex-search-clear']}
                      onClick={() => setSearchQuery('')}
                      aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                  {q ? (
                    <p className={styles['lex-search-meta']} role="status">
                      {searchEmpty
                        ? isAr
                          ? 'لا بند يطابق هذا البحث'
                          : 'No clause matches this search'
                        : isAr
                          ? `${hitCount} بند`
                          : `${hitCount} clause${hitCount === 1 ? '' : 's'}`}
                    </p>
                  ) : null}
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

            {/* ——— Main Content Layout ——— */}
            <div className={styles['lex-main-grid']}>
              {/* Sticky Sidebar (Table of Contents & Quick Support) */}
              <aside className={styles['lex-sidebar']}>
                <LexRail
                  items={visibleRail}
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
                    <Link href="/contact" className={styles['lex-sidebar-btn']}>
                      <Send className="w-3.5 h-3.5" />
                      <span>{pick(locale, 'تواصل مع الدعم', 'Contact Support')}</span>
                    </Link>
                  </div>
                )}
              </aside>

              {/* Main Document Content */}
              <main className={styles['lex-articles-flow']} id="lex-doc-content">
                {searchEmpty ? (
                  <div className={styles['lex-search-empty']}>
                    <strong>{isAr ? 'ما في بند بهالكلمات' : 'Nothing in this document matches'}</strong>
                    <p>
                      {isAr
                        ? 'جرّب كلمة ثانية من نص الوثيقة، أو امسح البحث لعرض كل البنود.'
                        : 'Try another word from the document, or clear the search to show every clause.'}
                    </p>
                  </div>
                ) : null}
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
                    {date ? `${code} · ${date}` : code}
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
                className={styles['lex-mail']}
              >
                <span>{CONTACT_EMAIL}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </footer>
          </div>
        </div>
      </SalonStage>
    </LexSearchContext.Provider>
  );
}

/* ══════════════ SUBCOMPONENTS ══════════════ */

export function LexHighlightsGrid({ children }: { children: ReactNode }) {
  const { query } = useContext(LexSearchContext);
  if (query.trim()) return null;
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
  const { query, report } = useContext(LexSearchContext);
  const hay = `${title} ${kicker ?? ''} ${collectText(children)}`.toLowerCase();
  const q = query.trim().toLowerCase();
  const match = !q || hay.includes(q);

  useEffect(() => {
    report(id, match);
    return () => report(id, false);
  }, [id, match, report]);

  if (q && !match) {
    return <section id={id} hidden className={styles['lex-section-card']} />;
  }

  const open = q ? true : isOpen;

  return (
    <section id={id} className={styles['lex-section-card']} data-open={open ? 'true' : 'false'}>
      <div
        className={styles['lex-section-head']}
        onClick={() => {
          if (!q) setIsOpen(!isOpen);
        }}
      >
        <div className={styles['lex-section-title-wrap']}>
          <span className={styles['lex-section-no']}>{index}</span>
          <div>
            {kicker ? (
              <span className={styles['lex-section-kicker']}>
                <Highlighted text={kicker} query={query} />
              </span>
            ) : null}
            <h2 className={styles['lex-section-title']}>
              <Highlighted text={title} query={query} />
            </h2>
          </div>
        </div>
        <ChevronDown className={`${styles['lex-section-toggle-icon']} w-5 h-5`} />
      </div>

      {open && <div className={styles['lex-section-body']}>{children}</div>}
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
