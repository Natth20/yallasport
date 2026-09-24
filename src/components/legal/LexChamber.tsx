import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { Reveal, HeroEnter } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { LexProgress, LexRail, type LexRailItem } from './LexRail';

/* —————————————————————————————————————————————
   The ledger: four gates, one identity.
   ————————————————————————————————————————————— */

export const LEX_GATES = [
  {
    href: '/privacy',
    code: 'L01',
    tone: 'vault',
    ar: 'سياسة الخصوصية',
    en: 'Privacy Policy',
    arHint: 'حماية البيانات والتشفير التام',
    enHint: 'Data security & zero tracker vault',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/terms',
    code: 'L02',
    tone: 'deed',
    ar: 'شروط الاستخدام',
    en: 'Terms of Use',
    arHint: 'ميثاق اللعب النظيف وقواعد المنصة',
    enHint: 'Fair-play charter & platform rules',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    ),
  },
  {
    href: '/copyright',
    code: 'L03',
    tone: 'mark',
    ar: 'حقوق النشر',
    en: 'Copyright & IP',
    arHint: 'اعتماد المصادر وحماية الملكية الفكرية',
    enHint: 'Verified sources & IP protections',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
      </svg>
    ),
  },
  {
    href: '/report',
    code: 'L04',
    tone: 'desk',
    ar: 'إبلاغ عن محتوى',
    en: 'VAR Incident Room',
    arHint: 'غرفة المراجعة وخط البلاغات السريع',
    enHint: 'Direct review room & incident desk',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
] as const;

export type LexTone = (typeof LEX_GATES)[number]['tone'];

/* —————————————————————————————————————————————
   Shell
   ————————————————————————————————————————————— */

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
  const currentGate = LEX_GATES.find((item) => item.href === path);
  const year = new Date().getFullYear();

  return (
    <div className="lex-chamber" data-lex-tone={tone}>
      <span className="lex-aurora" aria-hidden />
      <span className="lex-aurora is-low" aria-hidden />
      <span className="lex-weave" aria-hidden />
      {/* <LexProgress /> */}

      {/* ——— Masthead ——— */}
      <header className="lex-hero" data-ys-motion-manual="1">
        <HeroEnter>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/80 via-card/50 to-card/20 p-6 backdrop-blur-xl shadow-2xl md:p-8 lg:p-10">
            {/* Ambient Background Highlights */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
              {/* Left/Main Column */}
              <div className="space-y-6 lg:col-span-8">
                {/* Brand & Kicker Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <BrandMark size={46} priority />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary uppercase border border-primary/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          {pick(locale, 'يلا سبورت · الميثاق الرسمي', 'YALLA SPORT · OFFICIAL LEDGER')}
                        </span>
                        <span className="text-xs text-muted-foreground">|</span>
                        <span className="text-xs font-medium text-muted-foreground">{instrument}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-semibold text-foreground/80 shadow-inner">
                      {code}
                    </span>
                    <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                      {pick(locale, `موسم ${year}`, `Season ${year}`)}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {wordmark}
                  </h1>
                  <p className="text-base text-muted-foreground leading-relaxed md:text-lg max-w-3xl">
                    {lead}
                  </p>
                </div>

                {/* Seals / Feature Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {seals.map((seal) => (
                    <span
                      key={seal}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-white/10"
                    >
                      <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {seal}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: High-Tech Security Badge */}
              <aside className="flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-md lg:col-span-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
                        {currentGate?.icon ?? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          {pick(locale, 'وثيقة سارية ومعتمدة', 'Verified Digital Protocol')}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          SHA256: 7F9A · YS-LEGAL-{code}
                        </p>
                      </div>
                    </div>
                  </div>

                  <dl className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <dt className="text-muted-foreground">{pick(locale, 'الموضوع', 'Subject')}</dt>
                      <dd className="font-semibold text-white">{title}</dd>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <dt className="text-muted-foreground">{pick(locale, 'المرجع', 'Ref Code')}</dt>
                      <dd className="font-mono font-bold text-primary">{code}</dd>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <dt className="text-muted-foreground">{pick(locale, 'تاريخ التحديث', 'Last Modified')}</dt>
                      <dd className="text-foreground/90">{date}</dd>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <dt className="text-muted-foreground">{pick(locale, 'اللغات المدعومة', 'Languages')}</dt>
                      <dd className="font-mono text-emerald-400 font-semibold">AR · EN</dd>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <dt className="text-muted-foreground">{pick(locale, 'الحالة القانونية', 'Status')}</dt>
                      <dd className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {pick(locale, 'نافذ وملزم', 'Active & Binding')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 rounded-xl border border-white/5 bg-black/25 p-3 text-center text-[11px] text-muted-foreground">
                  <p>
                    {pick(
                      locale,
                      'يُقرأ هذا المستند كمرجع موثوق لنزاهة وحيادية يلا سبورت.',
                      'Read as the verified source for Yalla Sport integrity & fair play.'
                    )}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </HeroEnter>
      </header>

      {/* ——— The four gates: Luxury Modern Bar ——— */}
      <Reveal className="lex-gates-wrap mt-8">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {pick(locale, 'الميثاق واللوائح الرسمية', 'Official Platform Codex')}
          </p>
          <span className="text-[11px] text-muted-foreground font-mono">
            {pick(locale, '4 بوابات معتمدة', '4 Official Gates')}
          </span>
        </div>

        <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={pick(locale, 'دفتر القوانين', 'Legal ledger')}>
          {LEX_GATES.map((item, index) => {
            const active = item.href === path;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                  active
                    ? 'border-primary/60 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-white shadow-lg shadow-primary/10'
                    : 'border-white/10 bg-card/40 text-muted-foreground hover:border-white/20 hover:bg-card/70 hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-primary to-emerald-400" />
                )}

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    active
                      ? 'border-primary/40 bg-primary/20 text-primary'
                      : 'border-white/10 bg-white/5 text-muted-foreground group-hover:border-white/20 group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-sm leading-snug truncate">
                      {pick(locale, item.ar, item.en)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/80 uppercase">
                      {item.code}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {pick(locale, item.arHint, item.enHint)}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </Reveal>

      {/* ——— Body ——— */}
      <div className="lex-body mt-10">
        <aside className="lex-rail">
          <LexRail
            items={rail}
            heading={pick(locale, 'فهرس المواد', 'Article index')}
            readLabel={pick(locale, 'تقدّم القراءة', 'Read so far')}
          />
          {aside}
        </aside>

        <div className="lex-scroll">{children}</div>
      </div>

      {/* ——— Colophon ——— */}
      <Reveal className="lex-colophon-wrap mt-16">
        <footer className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <BrandMark size={36} />
            <div>
              <p className="font-bold text-sm text-white tracking-wide">YALLA SPORT</p>
              <p className="text-xs text-muted-foreground font-mono">
                {code} · {date}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            {pick(
              locale,
              'إن تعارض سطر تسويقي أو غير رسمي مع ما ورد في هذه الوثيقة، يُعتدّ بالنص الصادر هنا وبتاريخ آخر اعتماد.',
              'If a marketing statement conflicts with this document, the certified text here and latest date of enactment prevail.'
            )}
          </p>

          <a
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-primary/50 hover:bg-primary/10"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {CONTACT_EMAIL}
          </a>
        </footer>
      </Reveal>
    </div>
  );
}

/* —————————————————————————————————————————————
   Article
   ————————————————————————————————————————————— */

export function LexArticle({
  id,
  index,
  title,
  kicker,
  children,
}: {
  id: string;
  index: string;
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="lex-article group">
      <span className="lex-ghost" aria-hidden>
        {index}
      </span>
      <header className="lex-article-head">
        <span className="lex-article-no">{index}</span>
        <div>
          {kicker ? <p className="lex-article-kicker">{kicker}</p> : null}
          <h2>{title}</h2>
        </div>
      </header>
      <div className="lex-article-body">{children}</div>
    </section>
  );
}

/* —————————————————————————————————————————————
   Building blocks
   ————————————————————————————————————————————— */

export function LexTable({
  head,
  rows,
  mono,
}: {
  head: string[];
  rows: string[][];
  mono?: boolean;
}) {
  return (
    <div className="lex-table-wrap overflow-hidden rounded-2xl border border-white/10 bg-card/30 backdrop-blur-md">
      <table className={`lex-table${mono ? ' is-mono' : ''} w-full`}>
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-4 py-3 text-start text-xs font-bold text-white uppercase tracking-wider">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-xs text-muted-foreground">
          {rows.map((row) => (
            <tr key={row.join('|')} className="transition-colors hover:bg-white/[0.03]">
              {row.map((cell, index) => (
                <td key={index} className="px-4 py-3 text-start">
                  {mono && index === 0 ? (
                    <code className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary text-[11px] border border-primary/20">
                      {cell}
                    </code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LexPoints({ items, ordered }: { items: string[]; ordered?: boolean }) {
  if (ordered) {
    return (
      <ol className="lex-points is-ordered space-y-2.5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="lex-points space-y-2.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LexKeys({ rows }: { rows: { term: string; meaning: string }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.term} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-primary/30">
          <dt className="text-sm font-bold text-white mb-1.5">{row.term}</dt>
          <dd className="text-xs text-muted-foreground leading-relaxed">{row.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LexSplit({
  left,
  right,
}: {
  left: { title: string; items: string[] };
  right: { title: string; items: string[] };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 my-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {left.title}
        </p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          {left.items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
        <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          {right.title}
        </p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          {right.items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">✕</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LexNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="my-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-xs leading-relaxed text-muted-foreground">
      <div className="flex items-center gap-2 mb-1.5 font-bold text-primary">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </aside>
  );
}

export function LexCards({ rows }: { rows: { title: string; body: string }[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 my-4">
      {rows.map((row, index) => (
        <li key={row.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 font-mono text-[11px] font-bold text-white">
              {String(index + 1).padStart(2, '0')}
            </span>
            <strong className="text-sm text-white">{row.title}</strong>
          </div>
          <span className="text-xs text-muted-foreground leading-relaxed block">{row.body}</span>
        </li>
      ))}
    </ul>
  );
}

export function LexAsideCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-sm">
      <p className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-2">
        {title}
      </p>
      <div className="text-xs text-muted-foreground space-y-2">{children}</div>
    </div>
  );
}
