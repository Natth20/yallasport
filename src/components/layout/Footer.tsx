import { getTranslations } from 'next-intl/server';
import { ArrowUpRight, Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { BackToTop } from './BackToTop';
import { BrandMark } from '@/components/brand/BrandMark';

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  const arena = [
    { name: t('common.matches'), href: '/matches' },
    { name: t('common.leagues'), href: '/leagues' },
    { name: t('common.news'), href: '/news' },
    { name: t('common.broadcasts'), href: '/live' },
    { name: t('common.watch'), href: '/watch' },
    { name: t('common.tv_guide'), href: '/tv-guide' },
  ];

  const explore = [
    { name: t('footer.about'), href: '/about' },
    { name: t('footer.leaderboard'), href: '/leaderboard' },
    { name: t('common.search'), href: '/search' },
    { name: t('common.comparison'), href: '/compare' },
    { name: t('footer.connect'), href: '/contact' },
  ];

  const legal = [
    { name: t('common.privacy'), href: '/privacy' },
    { name: t('common.terms'), href: '/terms' },
    { name: t('footer.copyright'), href: '/copyright' },
    { name: t('common.report'), href: '/report' },
  ];

  const seals = [
    t('footer.licensed_only'),
    t('footer.approved_news'),
    t('footer.live_scores'),
  ];

  const gates = [
    {
      index: '01',
      title: t('footer.gate_live'),
      copy: t('footer.gate_live_copy'),
      href: '/live',
    },
    {
      index: '02',
      title: t('footer.gate_news'),
      copy: t('footer.gate_news_copy'),
      href: '/news',
    },
    {
      index: '03',
      title: t('footer.gate_watch'),
      copy: t('footer.gate_watch_copy'),
      href: '/watch',
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-card/60 backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Masthead Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
            <span className="text-primary">{t('footer.match_programme')}</span>
            <span className="hidden h-px w-6 bg-border sm:block" />
            <span>
              {t('footer.since')} {year}
            </span>
            <span>·</span>
            <span>{t('footer.edition')}</span>
          </div>
          <p className="hidden text-[10px] font-bold tracking-wider text-muted-foreground/70 md:block">
            {seals.join('  ·  ')}
          </p>
        </div>

        {/* Brand & Tonight Quick Gates */}
        <div className="grid gap-10 border-b border-border/60 py-10 md:grid-cols-12 md:gap-8 lg:py-12">
          <div className="flex flex-col gap-4 md:col-span-7 xl:col-span-5">
            <Link href="/" className="group inline-flex items-center gap-3.5 self-start" aria-label="Yalla Sport">
              <BrandMark size={46} className="transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_4px_12px_rgba(249,115,22,0.3)]" />
              <span className="flex flex-col">
                <span className="text-xl font-black leading-none tracking-tight text-foreground">
                  YALLA SPORT
                </span>
                <span className="mt-1.5 text-[9px] font-black uppercase tracking-[0.32em] text-primary">
                  {t('footer.tagline')}
                </span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{t('footer.description')}</p>
            <p className="max-w-sm border-s-2 border-primary/50 ps-3.5 text-xs leading-relaxed text-foreground/60">
              {t('footer.manifesto')}
            </p>
          </div>

          <div className="md:col-span-5 xl:col-span-7">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              {t('footer.tonight')}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {gates.map((gate) => (
                <Link
                  key={gate.href}
                  href={gate.href}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-card/80 p-4 transition-all hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular-nums text-[10px] font-black tracking-widest text-muted-foreground/60">
                      {gate.index}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-primary/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary rtl:rotate-[-90deg]" />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-black text-foreground transition-colors group-hover:text-primary">
                      {gate.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{gate.copy}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Columns & Contact Ticket */}
        <div className="grid gap-10 py-10 md:grid-cols-12 md:gap-8 lg:py-12">
          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:order-last md:col-span-12 xl:order-none xl:col-span-7"
            aria-label={t('footer.sitemap')}
          >
            <FooterColumn index="01" title={t('footer.arena')} links={arena} />
            <FooterColumn index="02" title={t('footer.explore')} links={explore} />
            <FooterColumn index="03" title={t('footer.legal')} links={legal} className="col-span-2 sm:col-span-1" />
          </nav>

          <div className="md:col-span-5 xl:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/80 to-card p-5 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 pb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                  {t('footer.write_us')}
                </p>
                <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary">
                  {t('footer.gate')} 01
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('footer.write_us_copy')}</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">{t('footer.desk_note')}</p>
              
              <a
                href="mailto:contact@yallasport.com"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/25 transition-all hover:scale-102 hover:brightness-110 active:scale-98"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{t('footer.email_cta')}</span>
              </a>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-muted-foreground">
                <span>{t('footer.desk')}:</span>
                <span className="font-mono text-foreground/80">contact@yallasport.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Colophon & Copyright */}
        <div className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
            <p>© {year} Yalla Sport. {t('footer.rights')}</p>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />
            <p>{t('footer.designed')}</p>
          </div>
          <div className="flex items-center gap-3">
            <BackToTop label={t('footer.back_to_top')} />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {t('footer.operational')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  index,
  title,
  links,
  className = '',
}: {
  index: string;
  title: string;
  links: { name: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-3.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
        <span className="tabular-nums text-muted-foreground/60">{index}</span>
        <span className="h-px w-3 bg-primary/40" />
        {title}
      </p>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={`${link.href}-${link.name}`}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-2" />
              <span>{link.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
