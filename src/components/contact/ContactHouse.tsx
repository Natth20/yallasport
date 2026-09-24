import { BrandMark } from '@/components/brand/BrandMark';
import { HeroEnter, Reveal, Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { getLocale, getTranslations } from 'next-intl/server';
import { ContactLetter } from './ContactLetter';
import styles from './contact-house.module.css';

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
    <div className={`${styles.contactHouse} relative min-h-screen overflow-hidden pb-16`}>
      {/* Subtle Background Lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[100px] opacity-50" />

      {/* Masthead Hero */}
      <header className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        <HeroEnter>
          <div className={`${styles.contactHero} relative overflow-hidden rounded-3xl p-8 md:p-12`}>
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column */}
              <div className="space-y-8 lg:col-span-8">
                <div className="flex flex-wrap items-center gap-4">
                  <BrandMark size={56} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-widest text-primary uppercase">
                        {t('kicker')}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        YS-OPS-{year}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl leading-[1.1]">
                    {t('title')}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    {t('headline')}
                  </p>
                </div>

                {/* Direct quick jumps */}
                <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-medium">
                  <a
                    href="#letter"
                    className="rounded-full border border-border bg-card/50 px-5 py-2 text-foreground transition-transform hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    {t('toc_letter')}
                  </a>
                  <a
                    href="#path"
                    className="rounded-full border border-border bg-card/50 px-5 py-2 text-foreground transition-transform hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    {t('toc_path')}
                  </a>
                  <a
                    href="#wings"
                    className="rounded-full border border-border bg-card/50 px-5 py-2 text-foreground transition-transform hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    {t('toc_wings')}
                  </a>
                  <a
                    href="#doors"
                    className="rounded-full border border-border bg-card/50 px-5 py-2 text-foreground transition-transform hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                  >
                    {t('toc_doors')}
                  </a>
                </div>
              </div>

              {/* Right Column: Operations SLA Badge */}
              <div className="lg:col-span-4">
                <div className="space-y-5 rounded-3xl border border-border bg-card/50 p-8">
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t('addr_to')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <a
                    className="block font-mono text-base font-bold text-foreground hover:text-primary transition-colors"
                    href={`mailto:${CONTACT_EMAIL}`}
                  >
                    {CONTACT_EMAIL}
                  </a>

                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {t('addr_note')}
                  </p>

                  <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4 text-[11px] text-muted-foreground font-medium">
                    <span>{locale === 'en' ? 'Average SLA' : 'متوسط وقت الرد'}</span>
                    <span className="font-mono font-bold text-primary">&lt; 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HeroEnter>
      </header>

      {/* Main Grid: Letter / Form + Process Side Plate */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Form Stage */}
        <Reveal>
          <section id="letter" className="scroll-mt-28 rounded-3xl border border-border bg-card/40 p-6 sm:p-10 backdrop-blur-xl">
            <div className="border-b border-border pb-5 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">01</span>
                <h2 className="text-xl font-extrabold text-foreground">{t('letter_title')}</h2>
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
            <section id="path" className="scroll-mt-28 rounded-3xl border border-border bg-card/40 p-6 backdrop-blur-xl">
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">02</span>
                  <h2 className="text-base font-bold text-foreground">{t('path_title')}</h2>
                </div>
              </div>

              <ol className="space-y-4">
                {path.map((step) => (
                  <li key={step.no} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/30">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 font-mono text-xs font-bold text-primary">
                      {step.no}
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-foreground block mb-0.5">{step.title}</strong>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="rounded-3xl border border-border bg-card/40 p-6 backdrop-blur-xl">
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
          <div className="border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">03</span>
              <h2 className="text-xl font-extrabold text-foreground">{t('wings_title')}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('wings_note')}</p>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wings.map((wing) => (
              <StaggerItem key={wing.no}>
                <article className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-md h-full transition hover:border-primary/40">
                  <span className="font-mono text-xs font-bold text-primary">{wing.no}</span>
                  <h3 className="text-sm font-bold text-foreground mt-2 mb-1">{wing.title}</h3>
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
          <div className="border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">04</span>
              <h2 className="text-xl font-extrabold text-foreground">{t('doors_title')}</h2>
            </div>
          </div>

          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doors.map((door) => (
              <StaggerItem key={door.href}>
                <Link
                  href={door.href}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card/70 text-foreground group"
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
