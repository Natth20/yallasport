'use client';

import { useState } from 'react';
import { Search, Compass, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import styles from './front-design.module.css';

const SECTIONS = [
  { href: '/news', ar: 'الأخبار', en: 'News' },
  { href: '/matches', ar: 'المباريات', en: 'Matches' },
  { href: '/live', ar: 'البث المباشر', en: 'Live' },
  { href: '/leagues', ar: 'الدوريات', en: 'Leagues' },
  { href: '/transfers', ar: 'الميركاتو', en: 'Transfers' },
  { href: '/stats', ar: 'الإحصائيات', en: 'Stats' },
  { href: '/videos', ar: 'الفيديو والملخصات', en: 'Videos' },
  { href: '/videos#reels', ar: 'الريلز', en: 'Reels' },
  { href: '/compare-players', ar: 'مقارنة اللاعبين', en: 'Compare' },
];

const HOT_TAGS = [
  { ar: 'دوري أبطال أوروبا', en: 'Champions League', query: 'دوري أبطال أوروبا' },
  { ar: 'ريال مدريد', en: 'Real Madrid', query: 'ريال مدريد' },
  { ar: 'برشلونة', en: 'Barcelona', query: 'برشلونة' },
  { ar: 'الهلال', en: 'Al Hilal', query: 'الهلال' },
  { ar: 'الأهلي', en: 'Al Ahly', query: 'الأهلي' },
  { ar: 'محمد صلاح', en: 'Salah', query: 'محمد صلاح' },
];

export function FrontUniversalSearchBar({ locale, sources = [] }: { locale: string; sources?: string[] }) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const chips = [ar ? 'جميع المصادر' : 'All Sources', ...sources.slice(0, 10)];
  const [source, setSource] = useState(chips[0]);

  const handleSearch = (searchTerm: string) => {
    const q = searchTerm.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (source && source !== chips[0]) params.set('source', source);
    router.push(`/news${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className={styles.searchSourcesSection}>
      {/* Central Command Search Bar */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch(query);
        }}
        className={styles.searchBarInputWrap}
      >
        <Search size={20} className={styles.searchBarIcon} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            ar
              ? 'ابحث في يلا سبورت .. فريق، بطولة، لاعب، أو نتيجة مباراة ...'
              : 'Search Yalla Sport: club, league, player, or match ...'
          }
          className={styles.searchBarInput}
        />
        <button type="submit" className={styles.searchBarSubmitBtn}>
          <Sparkles className="w-3.5 h-3.5 inline-block me-1.5" />
          {ar ? 'بحث فوري' : 'Search'}
        </button>
      </form>

      {/* Hot Trends / Quick Tags */}
      <div className={styles.sourcesChipsRow} aria-label={ar ? 'الأكثر بحثاً' : 'Trending Searches'}>
        <span className={styles.chipsRowLabel}>
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          {ar ? 'الأكثر تداولاً:' : 'Trending:'}
        </span>
        {HOT_TAGS.map((tag) => (
          <button
            key={tag.query}
            type="button"
            onClick={() => {
              setQuery(tag.query);
              handleSearch(tag.query);
            }}
            className={styles.sourceChip}
          >
            #{ar ? tag.ar : tag.en}
          </button>
        ))}
      </div>

      {/* Quick Navigation Sections */}
      <div className={styles.sourcesChipsRow} aria-label={ar ? 'أقسام المنصة' : 'Platform sections'}>
        <span className={styles.chipsRowLabel}>
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          {ar ? 'أقسام المنصة:' : 'Sections:'}
        </span>
        {SECTIONS.map((item) => (
          <Link key={item.href} href={item.href} className={styles.sourceChip}>
            {ar ? item.ar : item.en}
          </Link>
        ))}
      </div>

      {/* Verified News Sources Filter */}
      {sources.length > 0 ? (
        <div className={styles.sourcesChipsRow} aria-label={ar ? 'المصادر المعتمدة' : 'Sources'}>
          <span className={styles.chipsRowLabel}>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            {ar ? 'المصادر:' : 'Sources:'}
          </span>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSource(chip);
                if (chip !== chips[0]) router.push(`/news?source=${encodeURIComponent(chip)}`);
                else router.push('/news');
              }}
              className={`${styles.sourceChip} ${source === chip ? styles.sourceChipActive : ''}`}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
