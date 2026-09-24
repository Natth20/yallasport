import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontTransfers } from '@/lib/front/load-transfers';
import { FrontMark } from '../FrontMark';
import { ClientTime } from '@/components/datetime/ClientTime';

export async function TransfersChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const rows = await loadFrontTransfers(locale);
  if (rows.length === 0) return null;
  return (
    <section className="fp-chapter">
      <FrontMark num={t('ch06')} title={t('ch06_title')} note={t('ch06_note')} href="/transfers" cta={t('ch06_cta')} />
      <ul className="fp-list">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/player/${row.playerSlug}`}>
              {row.playerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.playerPhoto} alt="" />
              ) : (
                <span>{row.playerName.charAt(0)}</span>
              )}
              <strong>{row.playerName}</strong>
              <em>
                {[row.fromTeam, row.toTeam].filter(Boolean).join(locale === 'ar' ? ' ← ' : ' → ') || '—'}
                {row.fee ? ` · ${row.fee}` : ''}
                {' · '}
                <ClientTime value={row.date} options={{ day: 'numeric', month: 'short', year: 'numeric' }} />
              </em>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
