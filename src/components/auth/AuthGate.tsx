import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { PitchWatermark, TicketBarcode, WaxSeal } from '@/components/decor/CraftMarks';
import { Link } from '@/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import './auth-gate.css';

export async function AuthGate({
  code,
  kicker,
  title,
  lead,
  seals,
  children,
}: {
  code: string;
  kicker: string;
  title: string;
  lead: string;
  seals: string[];
  children: ReactNode;
}) {
  const t = await getTranslations('auth');
  const locale = await getLocale();
  const arabic = locale === 'ar';

  return (
    <div className="auth-gate">
      <div className="auth-stage">
        <aside className="auth-ribbon" aria-hidden="true">
          <PitchWatermark className="auth-ribbon-mark" />
          <div>
            <p className={`auth-kicker ${arabic ? 'is-ar' : ''}`}>{kicker}</p>
            <p className="auth-ribbon-title">{title}</p>
          </div>
          <span className="auth-folio">{code}</span>
        </aside>

        <section className="auth-paper">
          <span className="auth-perforation" aria-hidden="true" />
          <span className="auth-grain" aria-hidden="true" />

          <header className="auth-paper-brand">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <BrandMark size={36} />
              <span className={`text-[10px] font-bold text-primary ${arabic ? '' : 'uppercase tracking-[0.22em]'}`}>
                {t('gate')}
              </span>
            </Link>
            <span className="auth-folio lg:hidden">{code}</span>
          </header>

          <div className="auth-ticket-copy">
            <p className={`auth-kicker ink lg:hidden ${arabic ? 'is-ar' : ''}`}>{kicker}</p>
            <h1 className="auth-paper-title">{title}</h1>
            <p className="auth-paper-lead">{lead}</p>
          </div>

          <div className="auth-paper-body">{children}</div>

          <footer className="auth-paper-foot">
            <TicketBarcode className="text-primary/35" />
            <Link href="/" className="auth-back">
              {t('back')}
            </Link>
          </footer>
        </section>

        <section className="auth-pitch">
          <PitchWatermark className="auth-pitch-mark" />
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <BrandMark size={44} />
              <span className={`text-[10px] font-bold text-primary ${arabic ? '' : 'uppercase tracking-[0.28em]'}`}>
                {t('gate')}
              </span>
            </Link>
            <p className={`auth-kicker pitch mt-14 ${arabic ? 'is-ar' : ''}`}>{kicker}</p>
            <p className="auth-pitch-title">{title}</p>
            <p className="auth-pitch-lead">{lead}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {seals.map((seal) => (
                <span key={seal} className={`auth-seal ${arabic ? 'is-ar' : ''}`}>
                  {seal}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex items-end justify-between gap-6">
            <div>
              <p className="auth-pitch-meta">{code}</p>
              <TicketBarcode className="auth-pitch-barcode" />
            </div>
            <WaxSeal label={t('gate').replace(' ', '\n')} className="hidden xl:flex" />
          </div>
        </section>
      </div>
    </div>
  );
}
