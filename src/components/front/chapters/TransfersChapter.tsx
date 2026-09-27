import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontTransfers } from '@/lib/front/load-transfers';
import { FrontMark } from '../FrontMark';
import { ClientTime } from '@/components/datetime/ClientTime';
import { MetaLine } from '../MetaLine';
import shell from '../front-shell.module.css';
import styles from '../transfers.module.css';

export async function TransfersChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const rows = await loadFrontTransfers(locale);
  if (rows.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch06')} title={t('ch06_title')} note={t('ch06_note')} href="/transfers" cta={t('ch06_cta')} />
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={`/player/${row.playerSlug}`}>
                {row.playerPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.playerPhoto} alt="" />
                ) : (
                  <span className={styles.fallback}>{row.playerName.charAt(0)}</span>
                )}
                <strong>{row.playerName}</strong>
                <MetaLine
                  className={`${shell.meta} ${styles.detail}`}
                  parts={[
                    [row.fromTeam, row.toTeam].filter(Boolean).join(locale === 'ar' ? ' ← ' : ' → ') || '—',
                    row.fee,
                    <ClientTime key={row.id} value={row.date} options={{ day: 'numeric', month: 'short', year: 'numeric' }} />,
                  ]}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
