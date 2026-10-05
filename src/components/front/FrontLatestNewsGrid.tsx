import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { deskLabel } from '@/lib/news/desks';
import { ClientTime } from '@/components/datetime/ClientTime';
import { Eye, Clock, ArrowLeft, ArrowRight, Sparkles, Newspaper } from 'lucide-react';
import { FrontShareBtn } from './FrontShareBtn';
import styles from './front-design.module.css';

export async function FrontLatestNewsGrid() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { latest, rest, lead } = await loadFrontStories(locale);
  const pool = [...latest, ...rest, lead].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const unique = [...new Map(pool.map((row) => [row.id, row])).values()].slice(0, 12);
  if (unique.length === 0) return null;

  return (
    <section className={styles.latestNewsSection}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(234, 88, 12, 0.12)', borderColor: 'rgba(234, 88, 12, 0.3)' }}>
            <Clock className="w-4 h-4 text-orange-400" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أحدث الأخبار ومستجدات الساعة' : 'Latest News & Hourly Wire'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'تحديثات مستمرة على مدار 24 ساعة من شبكة مصادرنا الموثوقة.' : '24/7 continuous news stream from verified sports desks.'}
            </p>
          </div>
        </div>
        <Link href="/news" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          <span>{ar ? 'عرض كل الأخبار ←' : 'All News →'}</span>
        </Link>
      </div>

      <div className={styles.newsGrid3x4}>
        {unique.map((item, idx) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className={`${styles.newsCardGridItem}${idx > 5 ? ` ${styles.hideOnPhone}` : ''}`}
          >
            <div className={styles.newsCardImgWrap}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className={styles.newsCardImg} referrerPolicy="no-referrer" />
              ) : (
                <div className={styles.newsCardImgFallback} />
              )}
              <div className={styles.newsCardImgOverlay} />
              <span className={styles.storyCategoryPill}>{deskLabel(item.category, locale)}</span>
            </div>

            <div className={styles.newsCardBody}>
              <h4 className={styles.newsCardTitle}>{item.title}</h4>
              <div className={styles.newsCardMeta}>
                <span className={styles.newsSourcePill}>{item.sourceName || 'يلا سبورت'}</span>
                <span className={styles.newsTimePill}>
                  <ClientTime value={item.publishedAt} locale={locale} />
                </span>
              </div>
              <div className={styles.storyMetaRow} style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                <div className={styles.storyViews}>
                  <Eye size={12} className="text-amber-400" />
                  <span>{item.views ?? 0}</span>
                </div>
                <FrontShareBtn href={`/news/${item.slug}`} label={ar ? 'مشاركة' : 'Share'} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.loadMoreBtnRow}>
        <Link href="/news" className={styles.loadMoreBtn}>
          <span>{ar ? 'مشاهدة المزيد من الأخبار والتقارير' : 'Explore Full News Archive'}</span>
          {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>
    </section>
  );
}

