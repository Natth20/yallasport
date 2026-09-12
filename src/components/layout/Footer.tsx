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
    <footer className="site-colophon">
      <div className="colophon-pitch" aria-hidden="true" />
      <div className="colophon-flood" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="colophon-spot" aria-hidden="true" />
      <span className="colophon-corner colophon-corner-tl" aria-hidden="true" />
      <span className="colophon-corner colophon-corner-tr" aria-hidden="true" />
      <span className="colophon-corner colophon-corner-bl" aria-hidden="true" />
      <span className="colophon-corner colophon-corner-br" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="colophon-mast">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
            <span className="text-orange-400/90">{t('footer.match_programme')}</span>
            <span className="hidden h-px w-6 bg-white/15 sm:block" />
            <span>
              {t('footer.since')} {year}
            </span>
            <span className="text-white/20">·</span>
            <span>{t('footer.edition')}</span>
          </div>
          <p className="hidden text-[10px] font-medium tracking-[0.08em] text-white/35 md:block">
            {seals.join('  ·  ')}
          </p>
        </div>

        <div className="grid gap-10 border-b border-white/[0.07] py-12 md:grid-cols-12 md:gap-8 lg:py-14">
          <div className="flex flex-col gap-5 md:col-span-7 xl:col-span-5">
            <Link href="/" className="group inline-flex items-center gap-3.5 self-start" aria-label="Yalla Sport">
              <BrandMark size={52} className="transition-transform duration-500 group-hover:scale-105" />
              <span className="flex flex-col">
                <span className="text-[19px] font-extrabold leading-none tracking-[-0.06em] text-white">
                  YALLA SPORT
                </span>
                <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.34em] text-orange-400">
                  {t('footer.tagline')}
                </span>
              </span>
            </Link>
            <p className="max-w-md text-[14px] leading-8 text-white/60">{t('footer.description')}</p>
            <p className="max-w-sm border-s-2 border-orange-400/40 ps-4 text-[12px] leading-7 text-white/40">
              {t('footer.manifesto')}
            </p>
          </div>

          <div className="md:col-span-5 xl:col-span-7">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/75">
              {t('footer.tonight')}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {gates.map((gate) => (
                <Link key={gate.href} href={gate.href} className="colophon-gate group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular-nums text-[10px] font-bold tracking-[0.2em] text-white/25">
                      {gate.index}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-orange-400/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-400 rtl:rotate-[-90deg]" />
                  </div>
                  <p className="mt-4 text-[14px] font-bold tracking-tight text-white transition-colors group-hover:text-orange-300">
                    {gate.title}
                  </p>
                  <p className="mt-2 text-[12px] leading-6 text-white/40">{gate.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-12 py-12 md:grid-cols-12 md:gap-8 lg:py-14">
          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:order-last md:col-span-12 xl:order-none xl:col-span-7"
            aria-label={t('footer.sitemap')}
          >
            <FooterColumn index="01" title={t('footer.arena')} links={arena} />
            <FooterColumn index="02" title={t('footer.explore')} links={explore} />
            <FooterColumn index="03" title={t('footer.legal')} links={legal} className="col-span-2 sm:col-span-1" />
          </nav>

          <div className="md:col-span-5 xl:col-span-5">
            <div className="colophon-ticket overflow-hidden rounded-2xl border border-white/10">
              <div className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full bg-orange-500/14 blur-3xl" />
              <div className="colophon-ticket-notch colophon-ticket-notch-top" aria-hidden="true" />
              <div className="colophon-ticket-notch colophon-ticket-notch-bottom" aria-hidden="true" />

              <div className="grid sm:grid-cols-[1fr_5.5rem]">
                <div className="p-5 ps-6 sm:p-6 sm:ps-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/90">
                      {t('footer.write_us')}
                    </p>
                    <span className="rounded-full border border-orange-400/25 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.22em] text-orange-300/80">
                      {t('footer.gate')} 01
                    </span>
                  </div>
                  <p className="mt-3 max-w-sm text-[13px] leading-7 text-white/55">{t('footer.write_us_copy')}</p>
                  <p className="mt-2 text-[11px] text-white/30">{t('footer.desk_note')}</p>
                  <a
                    href="mailto:contact@yallasport.com"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-card px-4 py-3.5 text-[12px] font-bold text-foreground transition-all duration-300 hover:bg-orange-500 hover:text-primary-foreground hover:shadow-[0_12px_30px_-16px_rgba(249,115,22,0.9)]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t('footer.email_cta')}
                  </a>
                  <div className="mt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/25">
                      {t('footer.desk')}
                    </p>
                    <p className="mt-1 text-[12px] tracking-wide text-white/45">contact@yallasport.com</p>
                  </div>
                </div>

                <div className="colophon-ticket-stub flex items-center justify-center border-t border-white/10 py-4 sm:border-s sm:border-t-0 sm:py-0">
                  <div className="flex flex-row items-center gap-3 sm:flex-col sm:gap-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/30 [writing-mode:horizontal-tb] sm:[writing-mode:vertical-rl] sm:rotate-180">
                      YALLA
                    </span>
                    <TicketBarcode className="text-white/30 sm:rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden pb-2 pt-2">
          <PitchWatermark className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[min(200px,32vw)] w-auto -translate-y-1/2 text-white/[0.06]" />
          <p
            aria-hidden="true"
            className="colophon-wordmark pointer-events-none select-none text-center font-black leading-[0.72] tracking-[-0.08em]"
          >
            YALLA
          </p>
          <p
            aria-hidden="true"
            className="colophon-wordmark-sub pointer-events-none select-none text-center font-black leading-none tracking-[0.42em]"
          >
            SPORT
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/[0.07] py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 text-[11px] text-white/40 sm:flex-row sm:items-center sm:gap-3">
            <p>
              © {year} Yalla Sport. {t('footer.rights')}
            </p>
            <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <p>{t('footer.designed')}</p>
          </div>
          <div className="flex items-center gap-3">
            <BackToTop label={t('footer.back_to_top')} />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold text-white/55">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
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
      <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400/80">
        <span className="tabular-nums text-white/25">{index}</span>
        <span className="h-px w-4 bg-orange-400/40" />
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.name}`}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              <span className="h-px w-0 bg-orange-400 transition-all duration-300 group-hover:w-3" />
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
