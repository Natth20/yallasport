import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode, WaxSeal } from '@/components/decor/CraftMarks';
import { Link } from '@/i18n/navigation';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { pick } from '@/i18n/pick';

export const LEGAL_NAV = [
  { href: '/privacy', ar: 'الخصوصية', en: 'Privacy', code: 'L01' },
  { href: '/terms', ar: 'الشروط', en: 'Terms', code: 'L02' },
  { href: '/copyright', ar: 'حقوق النشر', en: 'Copyright', code: 'L03' },
  { href: '/report', ar: 'إبلاغ', en: 'Report', code: 'L04' },
] as const;

export function LegalNav({ locale, path }: { locale: string; path: string }) {
  return (
    <nav className="legal-folio mb-10 flex flex-wrap gap-2" aria-label={pick(locale, 'دفتر القوانين', 'Legal ledger')}>
      {LEGAL_NAV.map((item) => {
        const active = path === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-[12px] font-bold transition-colors ${
              active
                ? 'bg-foreground text-white dark:bg-card dark:text-foreground'
                : 'bg-white/70 text-foreground ring-1 ring-[#e4d4b4] hover:text-foreground dark:bg-card/[0.04] dark:text-foreground/60 dark:ring-white/10 dark:hover:text-white'
            }`}
          >
            <span className="me-2 text-[9px] uppercase tracking-[0.18em] opacity-50">{item.code}</span>
            {pick(locale, item.ar, item.en)}
          </Link>
        );
      })}
    </nav>
  );
}

type TocItem = { id: string; label: string };

export function LegalDesk({
  locale,
  path,
  code,
  gate,
  title,
  kicker,
  updated,
  summary,
  seals,
  toc,
  children,
}: {
  locale: string;
  path: string;
  code: string;
  gate: string;
  title: string;
  kicker: string;
  updated: string;
  summary: string;
  seals: string[];
  toc: TocItem[];
  children: ReactNode;
}) {
  return (
    <div className="legal-desk">
      <header className="legal-masthead">
        <PitchWatermark className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-40 w-auto text-white/[0.07]" />
        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-orange-400/90">
              {pick(locale, 'مكتب الملعب · الدفتر القانوني', 'Match desk · legal ledger')}
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              {gate} · {code}
            </span>
          </div>

          <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[11px] font-medium text-white/45">{kicker}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-white/60">{summary}</p>
            </div>
            <WaxSeal
              label={pick(locale, 'ختم\nالملعب', 'Pitch\nseal')}
              className="hidden sm:flex"
            />
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {seals.map((seal) => (
              <span
                key={seal}
                className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200/90"
              >
                {seal}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="legal-paper">
        <div className="legal-ticket mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-8 flex flex-col gap-4 border-b border-[#e6d7bb] pb-6 dark:border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={40} />
              <div>
                <p className="text-[15px] font-extrabold tracking-[-0.04em] text-foreground dark:text-foreground">
                  YALLA SPORT
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-600">
                  {updated}
                </p>
              </div>
            </div>
            <TicketBarcode className="text-muted-foreground dark:text-foreground/30" />
          </div>

          <LegalNav locale={locale} path={path} />

          <div className={`grid gap-10 ${toc.length ? 'lg:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
            {toc.length > 0 && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-600/90">
                  {pick(locale, 'فهرس البنود', 'Clause index')}
                </p>
                <ol className="space-y-1.5 border-s border-orange-400/30 ps-4">
                  {toc.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block text-[13px] leading-6 text-muted-foreground transition-colors hover:text-foreground dark:text-foreground/50 dark:hover:text-white"
                      >
                        <span className="me-2 font-mono text-[10px] text-orange-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </aside>
            )}

            <article className="legal-copy legal-docket space-y-8 text-[15px] leading-8 text-foreground dark:text-muted-foreground">
              {children}
            </article>
          </div>

          <footer className="mt-14 flex flex-col gap-3 border-t border-dashed border-[#d9c7a4] pt-6 text-[12px] text-muted-foreground dark:border-border dark:text-foreground/40 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {pick(locale, 'لرسائل المكتب:', 'Desk mail:')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-orange-600">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em]">{code} · {gate}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function LegalClause({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="legal-clause scroll-mt-28">
      <h2>
        <span className="legal-clause-index">{index}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
