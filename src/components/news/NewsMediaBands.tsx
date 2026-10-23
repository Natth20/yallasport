'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { Play, Film, Camera, ChevronRight, Calendar, Trophy, Shield, Sparkles, Flame, Clock } from 'lucide-react';
import { pick } from '@/i18n/pick';
import type { YoutubeCard } from '@/lib/youtube/present';
import type { PhotoFrame } from '@/components/photos/PhotoHall';
import { FrontWhen } from '@/components/front/FrontWhen';

function formatClock(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

/**
 * قسم معرض الصور وأحداث اليوم — تصميم فخم ومميز مطابق لمعايير غرفة الأخبار
 */
export function NewsPhotosBand({
  photos,
  locale,
}: {
  photos: PhotoFrame[];
  locale: string;
}) {
  if (!photos || photos.length === 0) return null;

  return (
    <section className="my-10 w-full">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-3 gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-500 flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-emerald-500" />
            {pick(locale, 'عدسة اليوم', 'Today in Pictures')}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {pick(locale, 'معرض صور وأحداث اليوم', 'Photo Gallery & Daily Events')}
            </h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-500">
              {photos.length} {pick(locale, 'صورة', 'photos')}
            </span>
          </div>
        </div>
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الصور', 'All photos')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {photos.slice(0, 4).map((photo, index) => (
          <Link
            key={photo.id}
            href={`/news/${photo.slug}`}
            className="group flex flex-col rounded-2xl overflow-hidden border border-border/70 dark:border-zinc-800/80 bg-card dark:bg-[#0c1017] hover:border-emerald-500/60 dark:hover:border-emerald-500/50 hover:shadow-[0_12px_32px_-10px_rgba(16,185,129,0.25)] hover:-translate-y-1 transition-all duration-300 text-start select-none"
          >
            {/* 1. Image Stage (Aspect 16/10) */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image}
                alt={photo.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 opacity-80 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />

              {/* Hover Center Camera Indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-[0_2px_16px_rgba(16,185,129,0.6)] border border-white/25 transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <Camera className="h-4 w-4" />
                </span>
              </div>

              {/* Top Badges */}
              <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
                {photo.categoryLabel ? (
                  <span className="truncate inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-black text-amber-300 border border-amber-300/30">
                    <Trophy className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{photo.categoryLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-black text-white/90 border border-white/20">
                    <Sparkles className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                    <span>{pick(locale, 'صورة اليوم', 'Photo')}</span>
                  </span>
                )}

                <span className="rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 font-mono text-[8.5px] font-black text-white/90 border border-white/10 shrink-0">
                  #{folio(index)}
                </span>
              </div>

              {photo.relatedTeam ? (
                <div className="absolute bottom-2.5 start-2.5 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/85 backdrop-blur-md text-[8.5px] font-black text-white shadow-xs">
                    <Shield className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[90px]">{photo.relatedTeam.name}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* 2. Structured Details Box */}
            <div className="flex flex-col flex-1 p-3 sm:p-3.5 gap-2 justify-between border-t border-border/50 dark:border-white/[0.06] bg-card dark:bg-[#0c1017]">
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[65%]">
                  <Camera className="h-3 w-3 shrink-0" />
                  <span className="truncate">{photo.sourceName || pick(locale, 'عدسة يلا سبورت', 'Yalla Sport Lens')}</span>
                </span>
                {photo.publishedAt ? (
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground/80 shrink-0">
                    <Calendar className="h-2.5 w-2.5" />
                    <FrontWhen value={photo.publishedAt} />
                  </span>
                ) : null}
              </div>

              <h3 className="text-xs sm:text-[12.5px] font-bold leading-[1.4] text-foreground/95 dark:text-zinc-100 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors break-words m-0">
                <bdi dir="auto">{photo.title}</bdi>
              </h3>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-white/[0.06] text-[9px] text-muted-foreground/75 font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-bold">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{pick(locale, 'تغطية مصورة', 'Photo story')}</span>
                </span>
                <span className="text-[8.5px] font-mono text-muted-foreground/60">
                  {pick(locale, 'يلا سبورت', 'YallaSport')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * قسم الفيديوهات وملخصات المباريات — تصميم سينمائي فخم ومميز
 */
export function NewsVideosBand({
  videos,
  locale,
}: {
  videos: YoutubeCard[];
  locale: string;
}) {
  if (!videos || videos.length === 0) return null;

  return (
    <section className="my-10 w-full">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-3 gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500 flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-red-500" />
            {pick(locale, 'سينما الملاعب', 'Cinema & Highlights')}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {pick(locale, 'أحدث الفيديوهات وملخصات المباريات', 'Latest Videos & Match Highlights')}
            </h2>
            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-black text-red-500">
              {videos.length} {pick(locale, 'فيديو', 'clips')}
            </span>
          </div>
        </div>
        <Link
          href="/videos"
          className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الفيديوهات', 'All videos')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
        {videos.slice(0, 6).map((video, index) => {
          const duration = formatClock(video.durationSec);
          return (
            <Link
              key={video.youtubeId}
              href={`/videos?v=${video.youtubeId}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border/70 dark:border-zinc-800/80 bg-card dark:bg-[#0c1017] hover:border-red-500/60 dark:hover:border-red-500/50 hover:shadow-[0_12px_32px_-10px_rgba(239,68,68,0.25)] hover:-translate-y-1 transition-all duration-300 text-start select-none"
            >
              {/* 1. Cinema 16:9 Screen */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 opacity-80 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />

                {/* Floating Cinema Play Button with Ambient Glow */}
                <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                  <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-[0_4px_22px_rgba(239,68,68,0.65)] border border-white/25 transform scale-90 group-hover:scale-105 transition-all duration-300">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current translate-x-0.5" />
                  </span>
                </div>

                {/* Top Badges */}
                <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between pointer-events-none z-10">
                  <span className="rounded-md bg-black/75 backdrop-blur-md px-1.5 py-0.5 font-mono text-[8.5px] font-black text-white/90 border border-white/10 shadow-xs">
                    #{folio(index)}
                  </span>

                  {duration ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono font-bold text-white border border-white/10 shadow-xs">
                      <Clock className="h-2.5 w-2.5 text-red-400" />
                      <span>{duration}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 2. Structured Details Under Video */}
              <div className="flex flex-col flex-1 p-3 sm:p-3.5 gap-2 justify-between border-t border-border/50 dark:border-white/[0.06] bg-card dark:bg-[#0c1017]">
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-500 dark:text-red-400 truncate max-w-[70%]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="truncate">{video.channelTitle}</span>
                  </span>
                  {video.publishedAt ? (
                    <span className="text-[9.5px] font-medium text-muted-foreground/80 shrink-0">
                      <FrontWhen value={video.publishedAt} />
                    </span>
                  ) : null}
                </div>

                <h3 className="text-xs sm:text-[13px] font-bold leading-[1.4] text-foreground/95 dark:text-zinc-100 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors break-words m-0">
                  <bdi dir="auto">{video.title}</bdi>
                </h3>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-white/[0.06] text-[9px] text-muted-foreground/75 font-medium">
                  <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-bold">
                    <Film className="h-2.5 w-2.5" />
                    <span>{pick(locale, 'فيديو وملخص', 'Highlight clip')}</span>
                  </span>
                  <span className="text-[8.5px] font-mono text-muted-foreground/60">
                    {pick(locale, 'سينما يلا سبورت', 'Yalla Cinema')}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * قسم الريلز واللقطات القصيرة — مطابق لتصميم ReelsDesk وصفحة /reels
 */
export function NewsReelsBand({
  reels,
  locale,
}: {
  reels: YoutubeCard[];
  locale: string;
}) {
  if (!reels || reels.length === 0) return null;

  return (
    <section className="my-10 w-full">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-3 gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            {pick(locale, 'لقطات سريعة', 'Shorts & Reels')}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {pick(locale, 'قسم الريلز واللقطات القصيرة', 'Reels & Football Moments')}
            </h2>
            <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-[10px] font-black text-orange-500">
              {reels.length} {pick(locale, 'ريل', 'shorts')}
            </span>
          </div>
        </div>
        <Link
          href="/reels"
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الريلز', 'All reels')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...reels]
          .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
          .slice(0, 6)
          .map((reel, index) => {
          const duration = formatClock(reel.durationSec);
          return (
            <Link
              key={reel.youtubeId}
              href={`/reels?v=${reel.youtubeId}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border/70 dark:border-zinc-800 bg-card dark:bg-zinc-950 hover:border-orange-500/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-start select-none"
            >
              {/* 1. Poster Thumbnail Box (Aspect 16/11) */}
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.thumbnailUrl || `https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg`}
                  alt={reel.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20 opacity-70 group-hover:opacity-40 transition-opacity duration-300" />

                {/* Hover Center Play Button with Soft Glow */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-[0_2px_14px_rgba(249,115,22,0.5)] border border-white/20 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                  </span>
                </div>

                {/* Top Badges */}
                <div className="absolute top-2 start-2 end-2 flex items-center justify-between pointer-events-none z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[8.5px] font-bold text-white border border-white/10 shadow-xs">
                    <Flame className="h-2.5 w-2.5 text-orange-400 fill-orange-400/30" />
                    <span>Shorts</span>
                  </span>

                  {duration ? (
                    <span className="rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[8.5px] font-mono text-white/90 border border-white/10 shadow-xs">
                      {duration}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 2. Ultra-Chic Details Under Poster */}
              <div className="flex flex-col flex-1 p-2.5 sm:p-3 gap-1.5 justify-between border-t border-border/50 dark:border-white/[0.06] bg-card dark:bg-[#0c1017]">
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-500 dark:text-orange-400 truncate max-w-[75%]">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="truncate">{reel.channelTitle}</span>
                  </span>
                  <span className="text-[8.5px] font-mono font-bold text-muted-foreground/50 dark:text-zinc-500 shrink-0">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <p className="text-[10.5px] sm:text-[11px] font-medium leading-[1.38] text-foreground/90 dark:text-zinc-200 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors break-words m-0">
                  <bdi dir="auto">{reel.title}</bdi>
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/40 dark:border-white/[0.06] text-[9px] text-muted-foreground/80 font-medium">
                  {reel.publishedAt ? (
                    <FrontWhen value={reel.publishedAt} />
                  ) : (
                    <span>يلا سبورت</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-muted-foreground/70 dark:text-zinc-400">
                    <Flame className="h-2.5 w-2.5 text-orange-500/70" />
                    <span>{pick(locale, 'ريلز', 'Reel')}</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
