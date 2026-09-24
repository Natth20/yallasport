import { getLocale, getTranslations } from 'next-intl/server';
import { loadFrontBoard } from '@/lib/front/load-board';
import { FrontMark } from '../FrontMark';
import { FrontMatchTile } from '../FrontMatchTile';

export async function BoardChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const matches = await loadFrontBoard(locale);
  if (matches.length === 0) return null;
  return (
    <section className="fp-chapter">
      <FrontMark num={t('ch01')} title={t('ch01_title')} note={t('ch01_note')} href="/matches" cta={t('ch01_cta')} />
      <div className="fp-match-grid">
        {matches.map((match) => (
          <FrontMatchTile
            key={match.id}
            match={match}
            liveLabel={t('live_badge')}
            ftLabel={t('ft_badge')}
            vsLabel={t('vs')}
          />
        ))}
      </div>
    </section>
  );
}
