import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { FrontMatchTile } from './FrontMatchTile';

export async function FrontHero() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [{ lead }, board] = await Promise.all([loadFrontStories(locale), loadFrontBoard(locale)]);
  const rail = board.slice(0, 3);

  return (
    <div className="fp-inner fp-hero-quiet">
      <div className="fp-hero-copy">
        <p className="fp-kicker">{t('kicker')}</p>
        {!lead?.image ? <h1>{t('headline')}</h1> : null}
        <nav className="fp-hero-cta">
          <Link href="/matches" className="fp-btn is-solid">
            {t('cta_matches')}
          </Link>
          <Link href="/live" className="fp-btn">
            {t('cta_live')}
          </Link>
          <Link href="/news" className="fp-btn">
            {t('cta_news')}
          </Link>
        </nav>
      </div>
      {rail.length > 0 ? (
        <div className="fp-hero-rail">
          {rail.map((match) => (
            <FrontMatchTile
              key={match.id}
              match={match}
              liveLabel={t('live_badge')}
              ftLabel={t('ft_badge')}
              vsLabel={t('vs')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
