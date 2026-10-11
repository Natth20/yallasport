'use client';

import { useMemo, useState } from 'react';
import { Search, Compass, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import styles from './front-design.module.css';

const SECTIONS = [
  { href: '/news', ar: 'أهم العناوين والتقارير', en: 'Top Reports' },
  { href: '/news#news-wall', ar: 'مستجدات الساعة', en: 'Latest News' },
  { href: '/matches', ar: 'أبرز المباريات', en: 'Top Matches' },
  { href: '/live', ar: 'البث المباشر', en: 'Live' },
  { href: '/leagues', ar: 'أخبار الدوريات الكبرى', en: 'Major Leagues' },
  { href: '/videos', ar: 'الفيديوهات والملخصات', en: 'Videos' },
  { href: '/videos/reels', ar: 'الريلز', en: 'Reels' },
  { href: '/photos', ar: 'معرض الصور', en: 'Photos' },
  { href: '/transfers', ar: 'الميركاتو والانتقالات', en: 'Transfers' },
  { href: '/stats', ar: 'الإحصائيات والترتيب', en: 'Stats' },
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

function formatSourceName(raw: string, ar: boolean): string {
  const name = raw.trim();
  if (/^بي بي سي|bbc/i.test(name)) return ar ? 'BBC عربي' : 'BBC Sport';
  if (/^آر تي|^rt\b/i.test(name)) return ar ? 'RT العربية' : 'RT Sport';
  if (/^فرانس 24|^france\s*24/i.test(name)) return ar ? 'فرانس 24' : 'France 24';
  if (/^سكاي نيوز|^sky\s*news/i.test(name)) return ar ? 'سكاي نيوز' : 'Sky News';
  if (/^الجزيرة|^al\s*jazeera/i.test(name)) return ar ? 'الجزيرة نت' : 'Al Jazeera';
  if (/^dw/i.test(name)) return ar ? 'DW عربية' : 'DW Sports';
  if (/^the\s*guardian/i.test(name)) return 'The Guardian';
  return name.replace(/\s*-\s*(رياضة|Sport|Football)$/i, '').trim();
}

export function FrontUniversalSearchBar({ locale, sources = [] }: { locale: string; sources?: string[] }) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const allLabel = ar ? 'جميع المصادر' : 'All Sources';
  const [activeSourceKey, setActiveSourceKey] = useState<string>('ALL');

  const normalizedSources = useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; label: string; queryKey: string }[] = [
      { key: 'ALL', label: allLabel, queryKey: '' },
    ];
    for (const src of sources) {
      const cleanLabel = formatSourceName(src, ar);
      if (!seen.has(cleanLabel)) {
        seen.add(cleanLabel);
        list.push({ key: src, label: cleanLabel, queryKey: src });
      }
    }
    return list;
  }, [sources, ar, allLabel]);

  const handleSearch = (searchTerm: string, chosenSourceKey = activeSourceKey) => {
    const q = searchTerm.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const chosen = normalizedSources.find((s) => s.key === chosenSourceKey);
    if (chosen && chosen.queryKey) {
      params.set('source', chosen.queryKey);
    }
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
          <Sparkles className="w-3.5 h-3.5 inline-block p-0.5 me-1.5" />
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
      {normalizedSources.length > 1 ? (
        <div className={styles.sourcesChipsRow} aria-label={ar ? 'المصادر المعتمدة' : 'Sources'}>
          <span className={styles.chipsRowLabel}>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            {ar ? 'المصادر:' : 'Sources:'}
          </span>
          {normalizedSources.map((item) => {
            const isActive = activeSourceKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveSourceKey(item.key);
                  if (item.queryKey) {
                    router.push(`/news?source=${encodeURIComponent(item.queryKey)}`);
                  } else {
                    router.push('/news');
                  }
                }}
                className={`${styles.sourceChip} ${isActive ? styles.sourceChipActive : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
