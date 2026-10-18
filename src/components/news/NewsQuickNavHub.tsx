'use client';

import React, { useState, useRef } from 'react';
import {
  Search,
  Flame,
  LayoutGrid,
  Newspaper,
  Radio,
  Trophy,
  Film,
  Camera,
  BarChart2,
  Calendar,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import type { DeskChip, SourceTally } from '@/lib/news/load-desk';

const TRENDING_TOPICS = [
  'ريال مدريد',
  'برشلونة',
  'ليفربول',
  'مانشستر سيتي',
  'الهلال',
  'النصر',
  'دوري أبطال أوروبا',
  'الدوري الإنجليزي',
  'دوري روشن',
];

interface NewsQuickNavHubProps {
  locale: string;
  query: string;
  selectedDesk: string;
  selectedSource: string;
  desks: DeskChip[];
  sources: SourceTally[];
}

export function NewsQuickNavHub({
  locale,
  query,
  selectedDesk,
  selectedSource,
  sources,
}: NewsQuickNavHubProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);
  const sourcesRef = useRef<HTMLDivElement>(null);

  const scrollSources = (direction: 'left' | 'right') => {
    if (!sourcesRef.current) return;
    const offset = direction === 'left' ? -260 : 260;
    sourcesRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const buildHref = (next: { q?: string; desk?: string; source?: string; page?: number }) => {
    const search = new URLSearchParams();
    const nextQuery = next.q !== undefined ? next.q : query;
    const nextDesk = next.desk !== undefined ? next.desk : selectedDesk;
    const nextSource = next.source !== undefined ? next.source : selectedSource;
    const nextPage = next.page ?? 1;
    if (nextQuery) search.set('q', nextQuery);
    if (nextDesk && nextDesk !== 'all') search.set('desk', nextDesk);
    if (nextSource && nextSource !== 'all') search.set('source', nextSource);
    if (nextPage > 1) search.set('page', String(nextPage));
    const val = search.toString();
    return val ? `/news?${val}` : '/news';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref({ q: searchInput.trim(), page: 1 }));
  };

  const platformSections = [
    { label: pick(locale, 'الأخبار', 'News'), href: '/news', active: true, icon: Newspaper },
    { label: pick(locale, 'المباريات', 'Matches'), href: '/matches', icon: Calendar },
    { label: pick(locale, 'البث الحي', 'Live'), href: '/live', badge: 'LIVE', icon: Radio },
    { label: pick(locale, 'البطولات', 'Leagues'), href: '/leagues', icon: Trophy },
    { label: pick(locale, 'الفيديوهات', 'Videos'), href: '/videos', icon: Film },
    { label: pick(locale, 'الريلز', 'Reels'), href: '/videos/reels', badge: 'HOT', icon: Flame },
    { label: pick(locale, 'الصور', 'Photos'), href: '/photos', icon: Camera },
    { label: pick(locale, 'الإحصائيات', 'Stats'), href: '/stats', icon: BarChart2 },
  ];

  return (
    <div className="w-full my-8 rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-sm space-y-6">
      {/* 1. الترويسة والبحث المباشر المنظم */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider mb-1">
            <Compass className="h-3 w-3" />
            {pick(locale, 'دليل الوصول السريع', 'Quick Navigation Hub')}
          </span>
          <h2 className="text-xl font-black text-foreground">
            {pick(locale, 'تصفح واستكشاف الأخبار', 'Explore News & Reports')}
          </h2>
        </div>

        {/* نموذج البحث المباشر */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={pick(locale, 'بحث فوري في الأخبار والتقارير…', 'Instant search in reports…')}
            className="w-full h-11 ps-10 pe-20 text-xs font-bold rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
          />
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <button
            type="submit"
            className="absolute end-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg bg-primary text-white text-xs font-black hover:bg-primary/90 transition-all shadow-xs"
          >
            {pick(locale, 'بحث', 'Search')}
          </button>
        </form>
      </div>

      {/* 2. أقسام المنصة كشبكة منظمة وأنيقة */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-black text-foreground">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span>{pick(locale, 'أقسام المنصة الرياضية:', 'Platform Sections:')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {platformSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all text-center group ${
                  sec.active
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border/60 bg-muted/30 text-foreground hover:border-primary/50 hover:bg-card hover:-translate-y-0.5'
                }`}
              >
                {sec.badge && (
                  <span
                    className={`absolute top-1 end-1 text-[8px] px-1 py-0.2 rounded font-black ${
                      sec.badge === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
                <Icon className={`h-4 w-4 mb-1 ${sec.active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span>{sec.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. الأكثر تداولاً */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2 text-xs font-black text-foreground">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>{pick(locale, 'موضوعات تتصدر التغطية الآن:', 'Trending Topics Now:')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TOPICS.map((topic) => {
            const isSelected = query === topic;
            return (
              <Link
                key={topic}
                href={buildHref({ q: isSelected ? '' : topic, page: 1 })}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-xs'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <span className="text-primary font-black">#</span>
                <span>{topic}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. مصادر الأخبار المعتمدة بنظام سحب فخم وسلس */}
      {sources.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <Newspaper className="h-4 w-4 text-emerald-500" />
              <span>{pick(locale, 'تصفية حسب المصدر المعتمد (اسحب للتصفح):', 'Filter by Source (Swipe to explore):')}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedSource !== 'all' && (
                <Link
                  href={buildHref({ source: 'all', page: 1 })}
                  className="text-[11px] font-bold text-primary hover:underline me-2"
                >
                  {pick(locale, 'عرض الكل', 'Show all')}
                </Link>
              )}
              {/* أزرار السحب السلس */}
              <button
                type="button"
                onClick={() => scrollSources('left')}
                aria-label="Previous"
                className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-all shadow-2xs"
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => scrollSources('right')}
                aria-label="Next"
                className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-all shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-0 rotate-180" />
              </button>
            </div>
          </div>

          <div
            ref={sourcesRef}
            className="flex items-center gap-2.5 overflow-x-auto scroll-smooth py-1 px-0.5 select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Link
              href={buildHref({ source: 'all', page: 1 })}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedSource === 'all'
                  ? 'border-primary bg-primary text-white font-black shadow-sm'
                  : 'border-border/70 bg-card text-foreground hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{pick(locale, 'كافة المصادر', 'All sources')}</span>
            </Link>
            {sources.map((src) => {
              const isSelected = selectedSource === src.name;
              return (
                <Link
                  key={src.name}
                  href={buildHref({ source: isSelected ? 'all' : src.name, page: 1 })}
                  className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white font-black shadow-sm'
                      : 'border-border/70 bg-card text-foreground hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <Newspaper className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                  <span>{src.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {src.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
