import { BrandMark } from '@/components/brand/BrandMark';
import { TicketBarcode, WaxSeal } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
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
    <div className="contact-folio watch-booth relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />

      <header className="booth-first-band relative z-10 mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <HeroEnter>
          <div className="contact-hero">
            <PhotoCorners className="contact-hero-corners" />
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex min-w-0 items-start gap-4">
                <BrandMark size={48} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e8b48a]">
                      {t('kicker')}
                    </p>
                    <EditionPlate year={year} label={t('folio')} className="watch-edition" />
                  </div>
                  <h1 className="contact-wordmark">{t('title')}</h1>
                  <p className="contact-standfirst">{t('headline')}</p>
                  <DeskRule className="mt-5 max-w-sm opacity-50" />
                </div>
              </div>

              <div className="contact-address">
                <WaxSeal label={t('seal')} className="contact-seal" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b48a]">
                    {t('addr_to')}
                  </p>
                  <a className="contact-mail" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  <TicketBarcode className="mt-3 text-[#e8b48a]/55" />
                </div>
              </div>
            </div>

            <nav className="contact-folio-nav" aria-label={t('toc_kicker')}>
              <a href="#letter">{t('toc_letter')}</a>
              <a href="#path">{t('toc_path')}</a>
              <a href="#wings">{t('toc_wings')}</a>
              <a href="#doors">{t('toc_doors')}</a>
            </nav>
          </div>
        </HeroEnter>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Reveal>
          <section id="letter" className="contact-letter-stage scroll-mt-28">
            <div className="watch-section-mark mb-5">
              <div className="watch-section-mark-row">
                <span aria-hidden>01</span>
                <h2>{t('letter_title')}</h2>
              </div>
              <p className="watch-section-lead">{t('letter_note')}</p>
              <DeskRule className="mt-3 max-w-xs opacity-45" />
            </div>

            <div className="contact-blotter">
              <span className="contact-blotter-grain" aria-hidden />
              <span className="contact-blotter-glow" aria-hidden />
              <div className="contact-blotter-head">
                <div>
                  <p className="contact-blotter-kicker">{t('blotter_head')}</p>
                  <p className="contact-blotter-to">{t('addr_to')}</p>
                </div>
                <div className="contact-blotter-meta">
                  <WaxSeal label={t('stamp_paid')} className="contact-blotter-seal" />
                  <TicketBarcode className="text-[#e8b48a]/50" />
                </div>
              </div>
              {session?.user?.email ? <p className="contact-blotter-note">{t('signed_note')}</p> : null}
              <div className="contact-sheet">
                <span className="contact-sheet-rule" aria-hidden />
                <ContactLetter defaultReply={session?.user?.email || ''} />
              </div>
            </div>
          </section>
        </Reveal>

        <aside className="watch-aside space-y-5">
          <Reveal delay={0.08}>
            <section id="path" className="contact-side-plate scroll-mt-28">
              <div className="watch-section-mark">
                <div className="watch-section-mark-row">
                  <span aria-hidden>02</span>
                  <h2>{t('path_title')}</h2>
                </div>
                <DeskRule className="mt-3 max-w-xs opacity-45" />
              </div>
              <ol className="contact-path mt-5">
                {path.map((step) => (
                  <li key={step.no}>
                    <em>{step.no}</em>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>

          <Reveal delay={0.12}>
            <section className="contact-side-plate">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b48a]">
                {t('addr_kicker')}
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground dark:text-foreground/55">{t('addr_note')}</p>
              <a className="watch-chip-link is-solid mt-4 inline-flex" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </section>
          </Reveal>
        </aside>
      </div>

      <Reveal>
        <section id="wings" className="relative z-10 mx-auto mt-12 max-w-7xl scroll-mt-28 px-4 sm:px-6">
          <div className="watch-section-mark mb-5">
            <div className="watch-section-mark-row">
              <span aria-hidden>03</span>
              <h2>{t('wings_title')}</h2>
            </div>
            <p className="watch-section-lead">{t('wings_note')}</p>
            <DeskRule className="mt-3 max-w-xs opacity-45" />
          </div>
          <Stagger className="contact-wings">
            {wings.map((wing) => (
              <StaggerItem key={wing.no}>
                <article className="contact-wing">
                  <span>{wing.no}</span>
                  <h3>{wing.title}</h3>
                  <p>{wing.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <Reveal>
        <section id="doors" className="relative z-10 mx-auto mt-12 max-w-7xl scroll-mt-28 px-4 sm:px-6">
          <div className="watch-section-mark mb-5">
            <div className="watch-section-mark-row">
              <span aria-hidden>04</span>
              <h2>{t('doors_title')}</h2>
            </div>
            <DeskRule className="mt-3 max-w-xs opacity-45" />
          </div>
          <Stagger className="contact-doors">
            {doors.map((door) => (
              <StaggerItem key={door.href}>
                <Link href={door.href} className="contact-door">
                  <strong>{door.label}</strong>
                  <span aria-hidden>→</span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-8 text-[11px] tracking-[0.08em] text-muted-foreground dark:text-foreground/30">
            {t('house')} · {t('folio')} · {locale.toUpperCase()}
          </p>
        </section>
      </Reveal>
    </div>
  );
}
