'use client';

import React from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import {
  ArrowLeft,
  Clock,
  Eye,
  Flame,
  Newspaper,
  Sparkles,
} from 'lucide-react';

export interface EditorialNewsItem {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  publishedAt: string | Date;
  readingTime?: number;
  sourceName?: string;
  views?: number;
}

interface EditorialNewsSixGridProps {
  locale: string;
  news: EditorialNewsItem[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
}

function decodeHtmlEntities(value: unknown): string {
  if (typeof value !== 'string') return value == null ? '' : String(value);
  return value
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function EditorialNewsSixGrid({
  locale,
  news,
  title,
  subtitle,
  viewAllHref = '/news',
}: EditorialNewsSixGridProps) {
  if (!news || news.length === 0) return null;

  // Take exactly up to 6 stories and split 3 on right, 3 on left
  const displayPool = news.slice(0, 6);
  const rightColumnStories = displayPool.slice(0, 3);
  const leftColumnStories = displayPool.slice(3, 6);

  const sectionTitle =
    title || pick(locale, 'أحدث الأخبار والتقارير', 'Latest News & Reports');
  const sectionSubtitle =
    subtitle ||
    pick(
      locale,
      'تغطية حصرية وشاملة لأهم المستجدات وكواليس الساحرة المستديرة من المصادر المعتمدة',
      'Exclusive coverage and behind-the-scenes reporting from verified sports outlets'
    );

  return (
    <section className="mt-12 sm:mt-16">
      {/* ----------------- GRAND EDITORIAL HEADER ----------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-7 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-amber-500/10 text-orange-500 ring-1 ring-orange-500/30 shadow-lg shadow-orange-500/5">
            <Newspaper size={24} />
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {sectionTitle}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-black text-orange-500 border border-orange-500/20 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                {displayPool.length} {pick(locale, 'تقارير مميزة', 'Exclusive Stories')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1 max-w-2xl">
              {sectionSubtitle}
            </p>
          </div>
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-2 text-xs font-black text-muted-foreground transition-all duration-300 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 hover:shadow-md group"
        >
          <span>{pick(locale, 'تصفح كافة الأخبار', 'View all stories')}</span>
          <ArrowLeft
            size={13}
            className="rtl:rotate-0 ltr:rotate-180 transition-transform duration-300 group-hover:-translate-x-1"
          />
        </Link>
      </div>

      {/* ----------------- 3 ON RIGHT / 3 ON LEFT EDITORIAL COLUMNS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* ===================== RIGHT COLUMN (الأخبار والصدارة - 3 مواد) ===================== */}
        <div className="flex flex-col gap-4">
          {/* Column Header Ribbon */}
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Flame size={14} />
              </span>
              <h3 className="text-sm font-black text-foreground">
                {pick(locale, 'أبرز العناوين والصدارة', 'Top Headlines & Lead Stories')}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-full">
              {rightColumnStories.length} {pick(locale, 'أخبار', 'Stories')}
            </span>
          </div>

          {/* Story #1: The Hero Spotlight (Card 1 of Right Side) */}
          {rightColumnStories[0] ? (
            <HeroSpotlightCard
              locale={locale}
              item={rightColumnStories[0]}
              itemNumber="01"
              badgeColor="orange"
            />
          ) : null}

          {/* Stories #2 & #3: Compact Luxury Cards (Cards 2 & 3 of Right Side) */}
          <div className="flex flex-col gap-3.5">
            {rightColumnStories.slice(1).map((item, idx) => (
              <SleekEditorialCard
                key={item.id}
                locale={locale}
                item={item}
                itemNumber={String(idx + 2).padStart(2, '0')}
              />
            ))}
          </div>
        </div>

        {/* ===================== LEFT COLUMN (التقارير والكواليس - 3 مواد) ===================== */}
        <div className="flex flex-col gap-4">
          {/* Column Header Ribbon */}
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Sparkles size={14} />
              </span>
              <h3 className="text-sm font-black text-foreground">
                {pick(locale, 'تقارير وكواليس خاصة', 'Special Reports & Insights')}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-full">
              {leftColumnStories.length > 0 ? leftColumnStories.length : rightColumnStories.length}{' '}
              {pick(locale, 'تقارير', 'Stories')}
            </span>
          </div>

          {/* Story #4: The Feature Spotlight (Card 1 of Left Side) */}
          {leftColumnStories[0] ? (
            <HeroSpotlightCard
              locale={locale}
              item={leftColumnStories[0]}
              itemNumber="04"
              badgeColor="amber"
            />
          ) : null}

          {/* Stories #5 & #6: Compact Luxury Cards (Cards 2 & 3 of Left Side) */}
          <div className="flex flex-col gap-3.5">
            {leftColumnStories.slice(1).map((item, idx) => (
              <SleekEditorialCard
                key={item.id}
                locale={locale}
                item={item}
                itemNumber={String(idx + 5).padStart(2, '0')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 1: HERO SPOTLIGHT CARD (بطاقة الغلاف الفخمة والمانشيت)
// ---------------------------------------------------------------------------
function HeroSpotlightCard({
  locale,
  item,
  itemNumber,
  badgeColor = 'orange',
}: {
  locale: string;
  item: EditorialNewsItem;
  itemNumber: string;
  badgeColor?: 'orange' | 'amber';
}) {
  const router = useRouter();
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group relative flex flex-col justify-end min-h-[300px] sm:min-h-[330px] rounded-3xl overflow-hidden border border-border/80 bg-card p-5 sm:p-6 shadow-xl transition-all duration-500 hover:border-orange-500/60 hover:shadow-2xl hover:shadow-orange-500/15 hover:-translate-y-1"
    >
      {/* 100% Bleed Image Container */}
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-muted">
        {item.featuredImage ? (
          <img
            src={item.featuredImage}
            alt={decodeHtmlEntities(item.title)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-card via-muted to-card">
            <Newspaper size={48} className="text-muted-foreground/30" />
          </div>
        )}

        {/* Cinematic Multi-Layer Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/25 opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-80" />
      </div>

      {/* Top Floating Utility Badges */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/news?desk=${encodeURIComponent(item.category || 'all')}`);
            }}
            title={pick(locale, `فتح قسم ${item.category || ''} بالكامل`, `Open full section for ${item.category || ''}`)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-lg backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95 border-none ${
              badgeColor === 'orange'
                ? 'bg-orange-500 text-white shadow-orange-500/30'
                : 'bg-amber-500 text-black shadow-amber-500/30 font-black'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {item.category || pick(locale, 'انفراد حصري', 'Featured Story')}
          </button>

          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white/90 border border-white/10">
            <Clock size={11} className="text-orange-400" />
            <ClientTime
              value={item.publishedAt}
              options={{ day: 'numeric', month: 'short' }}
              className="tabular-nums"
            />
          </span>
        </div>

        {/* Index Watermark Pill */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black text-white/90 border border-white/15 tabular-nums">
          {itemNumber}
        </span>
      </div>

      {/* Bottom Floating Editorial Content */}
      <div className="relative z-10 pt-6">
        {/* Source and reading time */}
        <div className="flex items-center gap-3 text-xs text-white/80 mb-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const src = item.sourceName || pick(locale, 'يلا سبورت', 'Yalla Sport');
              router.push(`/news?source=${encodeURIComponent(src)}`);
            }}
            title={pick(locale, `عرض جميع الأخبار من مصدر ${item.sourceName || 'يلا سبورت'}`, `View all news from source ${item.sourceName || 'Yalla Sport'}`)}
            className="flex items-center gap-1.5 font-bold cursor-pointer hover:underline border-none bg-transparent p-0 text-white/90"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>{item.sourceName || pick(locale, 'يلا سبورت', 'Yalla Sport')}</span>
          </button>

          {item.readingTime ? (
            <span className="text-[11px] text-white/70">
              · {item.readingTime} {pick(locale, 'دقيقة قراءة', 'min read')}
            </span>
          ) : null}

          {typeof item.views === 'number' && item.views > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-white/70 tabular-nums ms-auto">
              <Eye size={12} className="text-orange-400" />
              <span>{item.views.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
            </span>
          ) : null}
        </div>

        {/* Big Bold Headline */}
        <h4
          dir="auto"
          className="text-base sm:text-lg font-black text-white leading-tight line-clamp-2 transition-colors duration-200 group-hover:text-orange-300 drop-shadow-sm"
        >
          {decodeHtmlEntities(item.title)}
        </h4>

        {/* Excerpt */}
        {item.excerpt ? (
          <p
            dir="auto"
            className="mt-1.5 text-xs text-white/80 line-clamp-2 leading-relaxed hidden sm:block drop-shadow-xs"
          >
            {decodeHtmlEntities(item.excerpt)}
          </p>
        ) : null}

        {/* Read CTA with Animated Glow Button */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
          <span className="text-xs font-black text-orange-400 group-hover:text-white transition-colors">
            {pick(locale, 'قراءة التقرير بالكامل', 'Read full report')}
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-400">
            <ArrowLeft
              size={14}
              className="rtl:rotate-0 ltr:rotate-180 transition-transform duration-300 group-hover:-translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 2: SLEEK EDITORIAL CARD (البطاقة التحريرية الأنيقة المتراصة)
// ---------------------------------------------------------------------------
function SleekEditorialCard({
  locale,
  item,
  itemNumber,
}: {
  locale: string;
  item: EditorialNewsItem;
  itemNumber: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group relative flex items-stretch gap-3.5 sm:gap-4 rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl p-3 sm:p-3.5 shadow-sm transition-all duration-300 hover:border-orange-500/50 hover:bg-card hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Subtle hover accent line */}
      <div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 100% Cover Thumbnail Image */}
      <div className="relative w-28 sm:w-36 h-24 sm:h-26 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/50 shadow-inner">
        {item.featuredImage ? (
          <img
            src={item.featuredImage}
            alt={decodeHtmlEntities(item.title)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-orange-500/10 text-orange-500">
            <Newspaper size={26} className="opacity-70" />
          </div>
        )}

        {/* Thumbnail gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />

        {/* Small floating category tag */}
        {item.category ? (
          <div className="absolute bottom-1.5 start-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/news?desk=${encodeURIComponent(item.category || 'all')}`);
              }}
              title={pick(locale, `فتح قسم ${item.category} بالكامل`, `Open full section for ${item.category}`)}
              className="inline-block rounded-md bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-400 border border-orange-500/20 cursor-pointer hover:scale-105 transition-transform"
            >
              {item.category}
            </button>
          </div>
        ) : null}
      </div>

      {/* Editorial Text Area */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          {/* Header Row: Index number + Time */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-500 border border-orange-500/20 tabular-nums">
              #{itemNumber}
            </span>

            <span className="flex items-center gap-1 font-medium text-muted-foreground/90 shrink-0">
              <Clock size={11} className="opacity-70 text-orange-400" />
              <ClientTime
                value={item.publishedAt}
                options={{ day: 'numeric', month: 'short' }}
                className="tabular-nums text-[10px] sm:text-[11px]"
              />
            </span>
          </div>

          {/* Title */}
          <h4
            dir="auto"
            className="mt-1.5 text-xs sm:text-[13px] font-black text-foreground leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-orange-400"
          >
            {decodeHtmlEntities(item.title)}
          </h4>
        </div>

        {/* Footer Row: Source + Read Button */}
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate max-w-[11rem]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const src = item.sourceName || pick(locale, 'يلا سبورت', 'Yalla Sport');
                router.push(`/news?source=${encodeURIComponent(src)}`);
              }}
              title={pick(locale, `عرض جميع الأخبار من مصدر ${item.sourceName || 'يلا سبورت'}`, `View all news from source ${item.sourceName || 'Yalla Sport'}`)}
              className="flex items-center gap-1.5 truncate cursor-pointer hover:underline border-none bg-transparent p-0 text-start"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] shrink-0" />
              <span className="truncate font-semibold text-foreground/80">
                {item.sourceName || pick(locale, 'يلا سبورت', 'Yalla Sport')}
              </span>
            </button>

            {typeof item.views === 'number' && item.views > 0 ? (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/80 tabular-nums ms-1.5">
                <Eye size={10} className="text-orange-400" />
                <span>{item.views.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </span>
            ) : null}
          </div>

          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-xs shrink-0">
            <ArrowLeft
              size={11}
              className="rtl:rotate-0 ltr:rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
