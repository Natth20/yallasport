import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Reveal, Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { getLocale, getTranslations } from 'next-intl/server';
import { ContactLetter } from './ContactLetter';

export async function ContactHouse() {
  const t = await getTranslations('post');
  const locale = await getLocale();
  const session = await auth();
  const year = new Date().getFullYear();

  const wings = [
    { no: '01', title: t('wing_1_title'), body: t('wing_1_body') },
    { no: '02', title: t('wing_2_title'), body: t('wing_2_body') },
    { no: '03', title: t('wing_3_title'), body: t('wing_3_body') },
    { no: '04', title: t('wing_4_title'), body: t('wing_4_body') },
  ];

  const path = [
    { no: '01', title: t('path_1'), body: t('path_1_body') },
    { no: '02', title: t('path_2'), body: t('path_2_body') },
    { no: '03', title: t('path_3'), body: t('path_3_body') },
    { no: '04', title: t('path_4'), body: t('path_4_body') },
  ];

  const doors = [
    { href: '/report' as const, label: t('door_report') },
    { href: '/privacy' as const, label: t('door_privacy') },
    { href: '/copyright' as const, label: t('door_copy') },
    { href: '/about' as const, label: t('door_about') },
  ];

  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/15 via-cyan-500/10 to-transparent blur-3xl" />

      {/* Masthead Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-8 pb-10 sm:px-6 lg:px-8">
        <HeroEnter>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left Column */}
              <div className="space-y-6 lg:col-span-8">
                <div className="flex flex-wrap items-center gap-3">
                  <BrandMark size={48} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {t('kicker')}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-mono text-emerald-400">
                        YS-OPS-{year}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                    {t('title')}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                    {t('headline')}
                  </p>
                </div>

                {/* Direct quick jumps */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <a
                    href="#letter"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-foreground/80 transition hover:border-primary/40 hover:text-white"
                  >
                    {t('toc_letter')}
                  </a>
                  <a
                    href="#path"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-foreground/80 transition hover:border-primary/40 hover:text-white"
                  >
                    {t('toc_path')}
                  </a>
                  <a
                    href="#wings"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-foreground/80 transition hover:border-primary/40 hover:text-white"
                  >
                    {t('toc_wings')}
                  </a>
                  <a
                    href="#doors"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-foreground/80 transition hover:border-primary/40 hover:text-white"
                  >
                    {t('toc_doors')}
                  </a>
                </div>
              </div>

              {/* Right Column: Operations SLA Badge */}
              <div className="lg:col-span-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md shadow-inner space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {t('addr_to')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <a
                    className="block font-mono text-sm font-bold text-primary hover:underline"
                    href={`mailto:${CONTACT_EMAIL}`}
                  >
                    {CONTACT_EMAIL}
                  </a>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('addr_note')}
                  </p>

                  <div className="rounded-xl border border-white/5 bg-black/25 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>{locale === 'en' ? 'Average SLA' : 'متوسط وقت الرد'}</span>
                    <span className="font-mono font-bold text-emerald-400">&lt; 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HeroEnter>
      </header>

      {/* Main Grid: Letter / Form + Process Side Plate */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Form Stage */}
        <Reveal>
          <section id="letter" className="scroll-mt-28 rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="border-b border-white/10 pb-5 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">01</span>
                <h2 className="text-xl font-extrabold text-white">{t('letter_title')}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('letter_note')}</p>
            </div>

            {session?.user?.email && (
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-xs text-foreground/80 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>{t('signed_note')}</span>
              </div>
            )}

            <ContactLetter defaultReply={session?.user?.email || ''} />
          </section>
        </Reveal>

        {/* Process Side Rail */}
        <aside className="space-y-6">
          <Reveal delay={0.08}>
            <section id="path" className="scroll-mt-28 rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl">
              <div className="border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">02</span>
                  <h2 className="text-base font-bold text-white">{t('path_title')}</h2>
                </div>
              </div>

              <ol className="space-y-4">
                {path.map((step) => (
                  <li key={step.no} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 font-mono text-xs font-bold text-primary">
                      {step.no}
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-white block mb-0.5">{step.title}</strong>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="rounded-3xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest">{t('addr_kicker')}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t('addr_note')}</p>
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            </section>
          </Reveal>
        </aside>
      </div>

      {/* Wings / Inboxes */}
      <Reveal>
        <section id="wings" className="mx-auto mt-14 max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8">
          <div className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">03</span>
              <h2 className="text-xl font-extrabold text-white">{t('wings_title')}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('wings_note')}</p>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wings.map((wing) => (
              <StaggerItem key={wing.no}>
                <article className="rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur-md h-full transition hover:border-primary/40">
                  <span className="font-mono text-xs font-bold text-primary">{wing.no}</span>
                  <h3 className="text-sm font-bold text-white mt-2 mb-1">{wing.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{wing.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      {/* Doors / Navigation */}
      <Reveal>
        <section id="doors" className="mx-auto mt-14 max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8">
          <div className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">04</span>
              <h2 className="text-xl font-extrabold text-white">{t('doors_title')}</h2>
            </div>
          </div>

          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map((door) => (
              <StaggerItem key={door.href}>
                <Link
                  href={door.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card/70 text-white group"
                >
                  <strong className="text-xs font-bold group-hover:text-primary transition-colors">
                    {door.label}
                  </strong>
                  <span className="text-xs text-muted-foreground group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>

          <p className="mt-8 text-center text-xs text-muted-foreground font-mono">
            {t('house')} · {t('folio')} · {locale.toUpperCase()}
          </p>
        </section>
      </Reveal>
    </div>
  );
}
