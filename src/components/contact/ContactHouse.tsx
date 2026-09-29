import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
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
    { href: '/terms' as const, label: locale === 'ar' ? 'شروط الاستخدام' : 'Terms' },
    { href: '/cookies' as const, label: locale === 'ar' ? 'ملفات الارتباط' : 'Cookies' },
    { href: '/copyright' as const, label: t('door_copy') },
    { href: '/about' as const, label: t('door_about') },
  ];

  return (
    <SalonStage
      tone="post"
      wide
      compact
      kicker={t('kicker')}
      title={t('title')}
      lead={t('headline')}
      aside={CONTACT_EMAIL}
      tools={
        <HallFoyer
          label={t('kicker')}
          items={[
            { href: '/about', label: locale === 'ar' ? 'من نحن' : 'About' },
            { href: '/contact', label: locale === 'ar' ? 'تواصل' : 'Contact', current: true },
            { href: '/report', label: locale === 'ar' ? 'إبلاغ' : 'Report' },
            { href: '/privacy', label: locale === 'ar' ? 'الخصوصية' : 'Privacy' },
            { href: '/terms', label: locale === 'ar' ? 'الشروط' : 'Terms' },
          ]}
        />
      }
    >
      <div className={styles.house}>
        <div className={styles.split}>
          <section className={styles.panel} id="letter">
            <header className={styles.panelHead}>
              <div>
                <p>01</p>
                <h2>{t('letter_title')}</h2>
                <em>{t('letter_note')}</em>
              </div>
            </header>
            {session?.user?.email ? <p className={styles.note}>{t('signed_note')}</p> : null}
            <ContactLetter defaultReply={session?.user?.email || ''} />
          </section>

          <div className={styles.stack}>
            <section className={styles.panel} id="path">
              <header className={styles.panelHead}>
                <div>
                  <p>02</p>
                  <h2>{t('path_title')}</h2>
                </div>
              </header>
              <div className={styles.list}>
                {path.map((step) => (
                  <article key={step.no} className={styles.row}>
                    <b>{step.no}</b>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <div>
                  <p>{t('addr_kicker')}</p>
                  <h2>{t('addr_to')}</h2>
                  <em>{t('addr_note')}</em>
                </div>
              </header>
              <a className={styles.mail} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </section>
          </div>
        </div>

        <section className={styles.panel} id="wings">
          <header className={styles.panelHead}>
            <div>
              <p>03</p>
              <h2>{t('wings_title')}</h2>
              <em>{t('wings_note')}</em>
            </div>
          </header>
          <Stagger className={styles.grid} delay={0.02}>
            {wings.map((wing) => (
              <StaggerItem key={wing.no}>
                <article className={styles.card}>
                  <span>{wing.no}</span>
                  <h3>{wing.title}</h3>
                  <p>{wing.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className={styles.panel} id="doors">
          <header className={styles.panelHead}>
            <div>
              <p>04</p>
              <h2>{t('doors_title')}</h2>
            </div>
          </header>
          <div className={styles.doors}>
            {doors.map((door, index) => (
              <Link key={door.href} href={door.href} className={styles.door}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{door.label}</strong>
              </Link>
            ))}
          </div>
          <p className={styles.colo}>
            {t('house')} · {t('folio')} · {locale.toUpperCase()}
          </p>
        </section>
      </div>
    </SalonStage>
  );
}
