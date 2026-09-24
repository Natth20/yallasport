import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';

export async function PhotosChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { photos } = await loadFrontStories(locale);
  if (photos.length === 0) return null;
  return (
    <section className="fp-chapter">
      <FrontMark num={t('ch08')} title={t('ch08_title')} note={t('ch08_note')} href="/photos" cta={t('ch08_cta')} />
      <div className="fp-photos">
        {photos.map((story) => (
          <Link key={story.id} href={`/news/${story.slug}`} className="fp-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image!} alt="" referrerPolicy="no-referrer" />
            <span>{story.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
