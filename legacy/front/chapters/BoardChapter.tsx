import { getLocale, getTranslations } from 'next-intl/server';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { loadFrontBoard } from '@/lib/front/load-board';
import { FrontMark } from '../FrontMark';
import { FrontMatchTile } from '../FrontMatchTile';
import type { FrontMatch } from '@/lib/front/types';
import styles from '../front-hall.module.css';

function Grid({ matches, liveLabel, ftLabel, vsLabel }: { matches: FrontMatch[]; liveLabel: string; ftLabel: string; vsLabel: string }) {
  return (
    <div className={styles.matchGrid}>
      {matches.map((match) => (
        <FrontMatchTile
          key={match.id}
          match={match}
          liveLabel={liveLabel}
          ftLabel={ftLabel}
          vsLabel={vsLabel}
        />
      ))}
    </div>
  );
}

export async function BoardChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const matches = await loadFrontBoard(locale);
  if (matches.length === 0) return null;

  const live = matches.filter((match) => isLiveStatus(match.status));
  const done = matches.filter((match) => match.status === 'FINISHED');
  const soon = matches.filter((match) => !isLiveStatus(match.status) && match.status !== 'FINISHED');

  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch01')} title={t('ch01_title')} note={t('ch01_note')} href="/matches" cta={t('ch01_cta')} />
      {live.length > 0 ? (
        <div>
          <h3 className={styles.chapterH3}>{t('ch01_live')}</h3>
          <Grid matches={live} liveLabel={t('live_badge')} ftLabel={t('ft_badge')} vsLabel={t('vs')} />
        </div>
      ) : null}
      {soon.length > 0 ? (
        <div>
          <h3 className={styles.chapterH3}>{t('ch01_soon')}</h3>
          <Grid matches={soon} liveLabel={t('live_badge')} ftLabel={t('ft_badge')} vsLabel={t('vs')} />
        </div>
      ) : null}
      {done.length > 0 ? (
        <div>
          <h3 className={styles.chapterH3}>{t('ch01_done')}</h3>
          <Grid matches={done} liveLabel={t('live_badge')} ftLabel={t('ft_badge')} vsLabel={t('vs')} />
        </div>
      ) : null}
    </section>
  );
}
