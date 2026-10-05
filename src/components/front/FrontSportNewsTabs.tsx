'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { deskLabel } from '@/lib/news/desks';
import type { FrontStory } from '@/lib/front/types';
import { Eye, Globe2, Trophy, ArrowLeft, ArrowRight } from 'lucide-react';
import { FrontShareBtn } from './FrontShareBtn';
import styles from './front-design.module.css';

const TABS = [
  { id: 'all', ar: 'كل الدوريات', en: 'All Leagues' },
  { id: 'Premier League', ar: 'الدوري الإنجليزي', en: 'Premier League' },
  { id: 'La Liga', ar: 'الدوري الإسباني', en: 'La Liga' },
  { id: 'Saudi League', ar: 'دوري روشن السعودي', en: 'Saudi Pro League' },
  { id: 'Champions League', ar: 'دوري أبطال أوروبا', en: 'Champions League' },
  { id: 'International', ar: 'الكرة العالمية', en: 'World Football' },
] as const;

export function FrontSportNewsTabs({ locale, stories }: { locale: string; stories: FrontStory[] }) {
  const ar = locale === 'ar';
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const shown = useMemo(() => {
    const pool = tab === 'all' ? stories : stories.filter((story) => story.category === tab);
    return pool.slice(0, 4);
  }, [stories, tab]);

  if (stories.length === 0) return null;

  return (
    <section className={styles.sportNewsSection}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أخبار كرة القدم والدوريات الكبرى' : 'Football & Major Leagues News'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'تغطية مفصلة لأخبار كبرى الدوريات الأوروبية والعربية لحظة بلحظة.' : 'In-depth reporting across top European and Arab leagues.'}
            </p>
          </div>
        </div>
        <Link href="/news" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          <span>{ar ? 'جميع الأخبار ←' : 'All News →'}</span>
        </Link>
      </div>

      {/* Tabs Row */}
      <div className={styles.sportNewsTabsRow}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.sportNewsTabBtn} ${tab === item.id ? styles.sportNewsTabActive : ''}`}
            onClick={() => setTab(item.id)}
          >
            {ar ? item.ar : item.en}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className={styles.emptyFeedBox}>
          <p className={styles.emptyNote}>{ar ? 'لا توجد أخبار في هذا التصنيف حالياً.' : 'No stories in this desk yet.'}</p>
        </div>
      ) : (
        <div className={styles.newsGrid3x4}>
          {shown.map((story) => (
            <Link key={story.id} href={`/news/${story.slug}`} className={styles.newsCardGridItem}>
              <div className={styles.newsCardImgWrap}>
                {story.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.image} alt={story.title} className={styles.newsCardImg} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.newsCardImgFallback} />
                )}
                <div className={styles.newsCardImgOverlay} />
                <span className={styles.storyCategoryPill}>{deskLabel(story.category, locale)}</span>
              </div>
              <div className={styles.newsCardBody}>
                <h4 className={styles.newsCardTitle}>{story.title}</h4>
                <div className={styles.newsCardMeta}>
                  <span className={styles.newsSourcePill}>{story.sourceName || 'يلا سبورت'}</span>
                  <span className={styles.newsTimePill}>
                    <ClientTime value={story.publishedAt} locale={locale} />
                  </span>
                </div>
                <div className={styles.storyMetaRow} style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                  <div className={styles.storyViews}>
                    <Eye size={12} className="text-amber-400" />
                    <span>{story.views ?? 0}</span>
                  </div>
                  <FrontShareBtn href={`/news/${story.slug}`} label={ar ? 'مشاركة' : 'Share'} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

