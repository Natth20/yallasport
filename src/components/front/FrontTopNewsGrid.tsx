import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { deskLabel } from '@/lib/news/desks';
import { ClientTime } from '@/components/datetime/ClientTime';
import { Eye, Flame, Newspaper, ArrowLeft, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { FrontShareBtn } from './FrontShareBtn';
import styles from './front-design.module.css';

export async function FrontTopNewsGrid() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { lead, rest, latest } = await loadFrontStories(locale);
  // Ensure strict deduplication: do NOT repeat the hero story (lead)
  const leadId = lead?.id;
  const pool = [...rest, ...latest].filter((s) => s && s.id !== leadId);
  const main = pool[0];
  const side = pool.slice(1, 4);
  if (!main) return null;

  return (
    <section className={styles.topNewsSection} aria-label={ar ? 'أهم العناوين والتقارير' : 'Top Headlines'}>
      {/* Header */}
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Newspaper className="w-4 h-4 text-amber-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أهم العناوين والتقارير الرياضية' : 'Top Headlines & Featured Reports'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'تغطية إخبارية حصرية، تحليلات المباريات، وكواليس غرف الملابس من مصادر معتمدة.' : 'Exclusive reporting, tactical match analysis, and locker room insights.'}
            </p>
          </div>
        </div>
        <Link href="/news" className={styles.arenaFooterLink}>
          <span>{ar ? 'مركز الأخبار الكامل ←' : 'All News →'}</span>
        </Link>
      </div>

      {/* Grid: Main Story + 3 Equal-Height Stacked Stories */}
      <div className={styles.topNewsGrid}>
        
        {/* Main Lead Story Card (Right Side in RTL) */}
        <div className={styles.featuredStoryLarge}>
          <div className={styles.storyImgWrap}>
            <Link href={`/news/${main.slug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
              {main.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={main.image} alt={main.title} className={styles.storyImg} referrerPolicy="no-referrer" />
              ) : (
                <div className={styles.storyImgFallback} />
              )}
              <div className={styles.storyGradientOverlay} />
            </Link>
            <Link
              href={`/news?desk=${encodeURIComponent(main.category || 'all')}`}
              className={styles.storyCategoryPill}
              title={ar ? `فتح قسم ${deskLabel(main.category, locale)} بالكامل` : `Open full section for ${deskLabel(main.category, locale)}`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              {deskLabel(main.category, locale) || (ar ? 'تقرير القمة' : 'Lead Story')}
            </Link>
          </div>

          <div className={styles.storyBodyLarge}>
            <h4 className={styles.storyTitleLarge}>
              <Link href={`/news/${main.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {main.title}
              </Link>
            </h4>
            {main.excerpt ? <p className={styles.storyExcerptLarge}>{main.excerpt}</p> : null}

            <div className={styles.storyMetaRow}>
              <div className={styles.storyMetaLeft}>
                <Link
                  href={`/news?source=${encodeURIComponent(main.sourceName || 'يلا سبورت')}`}
                  className={styles.sourceVerifiedBadge}
                  style={{ textDecoration: 'none' }}
                  title={ar ? `عرض جميع الأخبار من مصدر ${main.sourceName || 'يلا سبورت'}` : `View all news from source ${main.sourceName || 'Yalla Sport'}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline-block me-1" />
                  {main.sourceName || 'يلا سبورت'}
                </Link>
                <span>•</span>
                <ClientTime value={main.publishedAt} locale={locale} />
              </div>
              <div className={styles.storyViews}>
                <Eye size={13} className="text-amber-500" />
                <span>{main.views ?? 0}</span>
                <FrontShareBtn href={`/news/${main.slug}`} label={ar ? 'مشاركة' : 'Share'} />
              </div>
            </div>
          </div>
        </div>

        {/* Side 3 Compact Stories (Equal dimensions aligned with Main Card) */}
        <div className={styles.storiesStackSide}>
          {side.map((story) => (
            <div key={story.id} className={styles.storyCardCompact}>
              <div className={styles.storyThumbWrap}>
                <Link href={`/news/${story.slug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                  {story.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.image} alt="" className={styles.storyThumb} referrerPolicy="no-referrer" />
                  ) : (
                    <div className={styles.storyThumbFallback} />
                  )}
                </Link>
              </div>
              <div className={styles.storyCompactContent}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <Link
                    href={`/news?desk=${encodeURIComponent(story.category || 'all')}`}
                    className={styles.storyCompactCategory}
                    style={{ textDecoration: 'none' }}
                    title={ar ? `فتح قسم ${deskLabel(story.category, locale)} بالكامل` : `Open full section for ${deskLabel(story.category, locale)}`}
                  >
                    {deskLabel(story.category, locale)}
                  </Link>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    <ClientTime value={story.publishedAt} locale={locale} />
                  </span>
                </div>
                <h5 className={styles.storyTitleCompact}>
                  <Link href={`/news/${story.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {story.title}
                  </Link>
                </h5>
                <div className={styles.storyMetaRow} style={{ marginTop: 'auto', paddingTop: '0.35rem', borderTop: 'none' }}>
                  <Link
                    href={`/news?source=${encodeURIComponent(story.sourceName || 'يلا سبورت')}`}
                    className={styles.storyCompactSource}
                    style={{ textDecoration: 'none' }}
                    title={ar ? `عرض جميع الأخبار من مصدر ${story.sourceName || 'يلا سبورت'}` : `View all news from source ${story.sourceName || 'Yalla Sport'}`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-500 inline-block me-1" />
                    {story.sourceName || 'يلا سبورت'}
                  </Link>
                  <div className={styles.storyViews}>
                    <Eye size={12} className="text-amber-500" />
                    <span>{story.views ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
