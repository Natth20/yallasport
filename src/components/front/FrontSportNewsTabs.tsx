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
  { id: 'all', emoji: '⚽', ar: 'الأهم والأكثر متابعة', en: 'Top & Trending', match: null },
  { id: 'Champions League', emoji: '🏆', ar: 'دوري أبطال أوروبا', en: 'Champions League', match: /champions\sleague|uefa|دوري\s*أبطال|دوري\sالأبطال/i },
  { id: 'Premier League', emoji: '🏴', ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League', match: /premier\sleague|\bepl\b|arsenal|liverpool|manchester|chelsea|tottenham|الدوري\sالإنجليزي|البريميرليغ/i },
  { id: 'La Liga', emoji: '🇪🇸', ar: 'الدوري الإسباني', en: 'La Liga', match: /la\s?liga|real\smadrid|barcelona|atletico|الدوري\sالإسباني|الليغا|ريال\sمدريد|برشلونة/i },
  { id: 'Serie A', emoji: '🇮🇹', ar: 'الدوري الإيطالي', en: 'Serie A', match: /serie\sa\b|juventus|\bmilan\b|inter\smilan|napoli|\broma\b|الدوري\sالإيطالي|يوفنتوس|ميلان|إنتر/i },
  { id: 'Bundesliga', emoji: '🇩🇪', ar: 'الدوري الألماني', en: 'Bundesliga', match: /bundesliga|bayern|borussia\sdortmund|leverkusen|الدوري\sالألماني|بايرن|دورتموند/i },
  { id: 'Ligue 1', emoji: '🇫🇷', ar: 'الدوري الفرنسي', en: 'Ligue 1', match: /ligue\s?1|paris\ssaint-germain|\bpsg\b|marseille|الدوري\sالفرنسي|باريس\sسان\sجيرمان/i },
  { id: 'Saudi League', emoji: '🇸🇦', ar: 'الدوري السعودي', en: 'Saudi Pro League', match: /saudi|roshn|al\s?hilal|al\s?nassr|al\s?ittihad|دوري\sروشن|الدوري\sالسعودي|الهلال|النصر/i },
  { id: 'MLS', emoji: '🇺🇸', ar: 'الدوري الأمريكي MLS', en: 'MLS', match: /mls\b|major\sleague\ssoccer|الدوري\sالأمريكي|إنتر\sميامي|inter\smiami/i },
  { id: 'Brasileirao', emoji: '🇧🇷', ar: 'الدوري البرازيلي', en: 'Brasileirão', match: /brasileir[aã]o|brazilian\sleague|الدوري\sالبرازيلي|فلامنغو|بالميراس|flamengo|palmeiras/i },
  { id: 'Argentine Primera', emoji: '🇦🇷', ar: 'الدوري الأرجنتيني', en: 'Argentine Primera', match: /argentine|الدوري\sالأرجنتيني|بوكا\sجونيورز|ريفر\sبليت|boca|river\splate/i },
  { id: 'Eredivisie', emoji: '🇳🇱', ar: 'الدوري الهولندي', en: 'Eredivisie', match: /eredivisie|الدوري\sالهولندي|أياكس|آيندهوفن|ajax|psv/i },
  { id: 'Primeira Liga', emoji: '🇵🇹', ar: 'الدوري البرتغالي', en: 'Primeira Liga', match: /primeira\sliga|الدوري\sالبرتغالي|بنفيكا|بورتو|سبورتينغ|benfica|porto|sporting/i },
  { id: 'Super Lig', emoji: '🇹🇷', ar: 'الدوري التركي', en: 'Süper Lig', match: /s[uü]per\slig|الدوري\sالتركي|غلطة\sسراي|فنربخشة|بشكتاش|galatasaray|fenerbahce/i },
  { id: 'Egyptian Premier', emoji: '🇪🇬', ar: 'الدوري المصري', en: 'Egyptian Premier League', match: /egyptian|الدوري\sالمصري|الأهلي\sالمصري|الزمالك|بيراميدز|al\s?ahly|zamalek/i },
] as const;

export function FrontSportNewsTabs({ locale, stories }: { locale: string; stories: FrontStory[] }) {
  const ar = locale === 'ar';
  const [tab, setTab] = useState<string>('all');
  const shown = useMemo(() => {
    if (tab === 'all') return stories.slice(0, 4);
    const activeTabObj = TABS.find((t) => t.id === tab);
    const pool = stories.filter((story) => {
      if (story.category === tab) return true;
      if (activeTabObj?.match) {
        return activeTabObj.match.test(story.title || '') || activeTabObj.match.test(story.slug || '');
      }
      return false;
    });
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
              {ar ? 'تغطية مفصلة لأخبار كبرى الدوريات الأوروبية والعربية والعالمية لحظة بلحظة.' : 'In-depth reporting across top European, Arab, and global leagues.'}
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
            <span className={styles.tabEmoji}>{item.emoji}</span>
            <span>{ar ? item.ar : item.en}</span>
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

