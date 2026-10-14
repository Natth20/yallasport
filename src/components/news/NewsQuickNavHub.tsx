'use client';

import React, { useState } from 'react';
import { Search, Flame, LayoutGrid, Newspaper, Radio, Trophy, Film, Camera, BarChart2 } from 'lucide-react';
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
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number }) => string;
}

export function NewsQuickNavHub({
  locale,
  query,
  selectedDesk,
  selectedSource,
  sources,
  hrefFor,
}: NewsQuickNavHubProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(hrefFor({ q: searchInput.trim(), page: 1 }));
  };

  const platformSections = [
    { label: pick(locale, 'الأخبار', 'News'), href: '/news', icon: Newspaper, active: true },
    { label: pick(locale, 'المباريات', 'Matches'), href: '/matches', icon: Trophy },
    { label: pick(locale, 'البث الحي', 'Live'), href: '/live', icon: Radio, badge: 'LIVE' },
    { label: pick(locale, 'البطولات', 'Leagues'), href: '/leagues', icon: Trophy },
    { label: pick(locale, 'الفيديوهات', 'Videos'), href: '/videos', icon: Film },
    { label: pick(locale, 'الريلز', 'Reels'), href: '/videos/reels', icon: Film, badge: 'HOT' },
    { label: pick(locale, 'الصور', 'Photos'), href: '/photos', icon: Camera },
    { label: pick(locale, 'الإحصائيات', 'Stats'), href: '/stats', icon: BarChart2 },
  ];

  return (
    <div className="w-full my-6 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md shadow-sm p-5 space-y-5">
      {/* 1. ترويسة المربع والبحث الفوري */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-primary">
            <LayoutGrid className="h-3.5 w-3.5" />
            {pick(locale, 'دليل الوصول السريع', 'Quick Navigation Hub')}
          </span>
          <h2 className="text-lg font-black text-foreground mt-0.5">
            {pick(locale, 'مربع التنقل المباشر', 'Direct Navigation & Search')}
          </h2>
        </div>

        {/* نموذج البحث الفوري */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={pick(locale, 'بحث فوري في الأخبار والتقارير…', 'Instant search in reports…')}
            className="w-full h-10 ps-10 pe-20 text-xs font-bold rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <button
            type="submit"
            className="absolute end-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg bg-primary text-white text-[11px] font-black hover:bg-primary/90 transition-all"
          >
            {pick(locale, 'بحث', 'Search')}
          </button>
        </form>
      </div>

      <div className="h-px w-full bg-border/50" />

      {/* 2. الأكثر تداولاً */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>{pick(locale, 'الأكثر تداولاً الآن:', 'Trending Topics:')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING_TOPICS.map((topic) => (
            <Link
              key={topic}
              href={hrefFor({ q: topic, page: 1 })}
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                query === topic
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              #{topic}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. أقسام المنصة */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
          <LayoutGrid className="h-3.5 w-3.5 text-primary" />
          <span>{pick(locale, 'أقسام المنصة الرئيسية:', 'Platform Sections:')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {platformSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                  sec.active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 bg-background/50 text-foreground hover:border-primary/40 hover:text-primary'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{sec.label}</span>
                {sec.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                    sec.badge === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'
                  }`}>
                    {sec.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. مصادر الأخبار */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
              <Newspaper className="h-3.5 w-3.5 text-emerald-500" />
              <span>{pick(locale, 'مصادر الأخبار المعتمدة:', 'Approved News Sources:')}</span>
            </div>
            {selectedSource !== 'all' && (
              <Link
                href={hrefFor({ source: 'all', page: 1 })}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {pick(locale, 'عرض كل المصادر', 'Show all sources')}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={hrefFor({ source: 'all', page: 1 })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedSource === 'all'
                  ? 'bg-foreground text-background font-black'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {pick(locale, 'كافة المصادر', 'All sources')}
            </Link>
            {sources.map((src) => (
              <Link
                key={src.name}
                href={hrefFor({ source: selectedSource === src.name ? 'all' : src.name, page: 1 })}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  selectedSource === src.name
                    ? 'border-primary bg-primary text-white font-black'
                    : 'border-border/50 bg-background/60 text-foreground hover:border-primary/50'
                }`}
              >
                <span>{src.name}</span>
                <span className={`text-[10px] px-1 rounded-md ${
                  selectedSource === src.name ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                }`}>
                  {src.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
