import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { Link } from '@/i18n/navigation';
import { KeyRound, LifeBuoy, UserPlus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import styles from './auth-gate.module.css';

function ticketParts(code: string) {
  const match = code.match(/YS-([A-Za-z])(\d+)/);
  return {
    row: match?.[1]?.toUpperCase() ?? 'A',
    seat: match?.[2] ?? '01',
  };
}

export async function AuthGate({
  code,
  kicker,
  title,
  lead,
  seals,
  gate,
  children,
}: {
  code: string;
  kicker: string;
  title: string;
  lead: string;
  seals: string[];
  gate: 'login' | 'register' | 'forgot';
  children: ReactNode;
}) {
  const t = await getTranslations('auth');
  const { row, seat } = ticketParts(code);
  const box =
    gate === 'register' ? t('box_register') : gate === 'forgot' ? t('box_recover') : t('box_login');

  return (
    <SalonStage
      tone="turn"
      compact
      kicker={kicker}
      title={title}
      lead={lead}
      aside={code}
      tools={
        <HallFoyer
          label={t('gate')}
          items={[
            { href: '/login', label: t('login_title'), icon: KeyRound, current: gate === 'login' },
            { href: '/register', label: t('register_title'), icon: UserPlus, current: gate === 'register' },
            { href: '/forgot-password', label: t('recover_title'), icon: LifeBuoy, current: gate === 'forgot' },
          ]}
        />
      }
    >
      <div className={styles.authGate} data-gate={gate}>
        <div className={styles.stage}>
          <aside className={styles.pitch}>
            <span className={styles.watermark} aria-hidden>
              YS
            </span>
            <div className={styles.bezel}>
              <span className={styles.bezelLive}>
                <span className={styles.eq} aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                {box}
              </span>
              <span className={styles.bezelMeta}>
                <span className={styles.hd}>HD</span>
                <span>{code}</span>
              </span>
            </div>

            <div className={styles.pitchBody}>
              <Link href="/" className={styles.brand}>
                <BrandMark size={40} priority />
                <span>{t('gate')}</span>
              </Link>
              <p className={styles.kicker}>{kicker}</p>
              <h2 className={styles.pitchTitle}>{title}</h2>
              <p className={styles.pitchLead}>{lead}</p>
              <div className={styles.seals}>
                {seals.map((seal) => (
                  <span key={seal} className={styles.seal}>
                    {seal}
                  </span>
                ))}
              </div>
            </div>

            <dl className={styles.stub}>
              <div>
                <dt>{t('stub_row')}</dt>
                <dd>{row}</dd>
              </div>
              <div>
                <dt>{t('stub_seat')}</dt>
                <dd>{seat}</dd>
              </div>
              <div>
                <dt>{t('gate')}</dt>
                <dd>{code}</dd>
              </div>
            </dl>
          </aside>

          <div className={styles.perforation} aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <section className={styles.paper}>
            <header className={styles.paperHead}>
              <div>
                <p className={styles.paperKicker}>{kicker}</p>
                <h2 className={styles.paperTitle}>{title}</h2>
                <p className={styles.paperLead}>{lead}</p>
              </div>
              <span className={styles.stamp} aria-hidden>
                YALLA
              </span>
            </header>

            <ol className={styles.protocol}>
              <li>
                <span>01</span>
                {t('protocol_1')}
              </li>
              <li>
                <span>02</span>
                {t('protocol_2')}
              </li>
            </ol>

            <div className={styles.body}>{children}</div>
            <footer className={styles.foot}>
              <Link href="/" className={styles.back}>
                {t('back')}
              </Link>
              <span className={styles.code}>{code}</span>
            </footer>
          </section>
        </div>
      </div>
    </SalonStage>
  );
}
