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
 * قسم معرض الصور وأحداث اليوم — مطابق لتصميم صالة الصور PhotoHall
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
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-primary" />
            {pick(locale, 'عدسة اليوم', 'Today in Pictures')}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {pick(locale, 'معرض صور وأحداث اليوم', 'Photo Gallery & Daily Events')}
            </h2>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary">
              {photos.length} {pick(locale, 'صورة', 'photos')}
            </span>
          </div>
        </div>
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الصور', 'All photos')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {photos.slice(0, 4).map((photo, index) => (
          <Link
            key={photo.id}
            href={`/news/${photo.slug}`}
            className="group relative block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/70 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Image Stage */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image}
                alt={photo.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />

              {/* Folio numbering badge (PhotoHall style) */}
              <span className="absolute bottom-2 end-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-black text-white/90 backdrop-blur-sm">
                {folio(index)}
              </span>

              {/* Category pill on top of image (PhotoHall style) */}
              <div className="absolute top-2.5 start-2.5 z-10 flex flex-wrap gap-1 max-w-[80%]">
                {photo.categoryLabel ? (
                  <span className="truncate inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9.5px] font-black text-amber-300 border border-amber-300/30">
                    <Trophy className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                    <span className="truncate">{photo.categoryLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9.5px] font-black text-white/90 border border-white/20">
                    <Sparkles className="h-2.5 w-2.5 text-primary shrink-0" />
                    <span>{pick(locale, 'صورة اليوم', 'Photo of the day')}</span>
                  </span>
                )}
              </div>

              {photo.relatedTeam ? (
                <div className="absolute top-2.5 end-2.5 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-[9px] font-black text-white shadow-xs">
                    <Shield className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[80px]">{photo.relatedTeam.name}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* Info Body */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <span className="inline-flex items-center gap-1 text-primary font-bold">
                  <Camera className="h-3 w-3" />
                  <span className="truncate max-w-[130px]">{photo.sourceName || pick(locale, 'عدسة يلا سبورت', 'Yalla Sport Lens')}</span>
                </span>
                {photo.publishedAt ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Calendar className="h-3 w-3" />
                    <FrontWhen value={photo.publishedAt} />
                  </span>
                ) : null}
              </div>
              <h3 className="text-xs font-bold leading-relaxed text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                <bdi dir="auto">{photo.title}</bdi>
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * قسم الفيديوهات وملخصات المباريات — مطابق لقاعة السينما YoutubeDesk
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
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-primary" />
            {pick(locale, 'سينما الملاعب', 'Cinema & Highlights')}
          </p>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h2 className="text-xl font-black text-foreground sm:text-2xl">
              {pick(locale, 'أحدث الفيديوهات وملخصات المباريات', 'Latest Videos & Match Highlights')}
            </h2>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary">
              {videos.length} {pick(locale, 'فيديو', 'clips')}
            </span>
          </div>
        </div>
        <Link
          href="/videos"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الفيديوهات', 'All videos')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.slice(0, 4).map((video, index) => {
          const duration = formatClock(video.durationSec);
          return (
            <Link
              key={video.youtubeId}
              href={`/videos?v=${video.youtubeId}`}
              className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Folio index */}
                <span className="absolute top-2.5 start-2.5 z-10 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[9px] font-black text-white/90 backdrop-blur-sm">
                  {folio(index)}
                </span>

                {/* Duration Badge */}
                {duration ? (
                  <span className="absolute bottom-2.5 end-2.5 z-10 inline-flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono font-bold text-white">
                    <Clock className="h-2.5 w-2.5 text-primary" />
                    <span>{duration}</span>
                  </span>
                ) : null}

                {/* Play button overlay on hover */}
                <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-xl shadow-primary/40 transform group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-current translate-x-0.5" />
                  </span>
                </span>
              </div>

              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black truncate max-w-[65%]">
                    {video.channelTitle}
                  </span>
                  {video.publishedAt ? (
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                      <FrontWhen value={video.publishedAt} />
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xs font-bold leading-5 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  <bdi dir="auto">{video.title}</bdi>
                </h3>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {reels.slice(0, 4).map((reel) => {
          const duration = formatClock(reel.durationSec);
          return (
            <Link
              key={reel.youtubeId}
              href={`/reels?v=${reel.youtubeId}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border/70 bg-card hover:border-orange-500/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Poster Thumbnail - compact aspect ratio to eliminate black gaps (ReelsDesk style) */}
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.thumbnailUrl || `https://i.ytimg.com/vi/${reel.youtubeId}/hqdefault.jpg`}
                  alt={reel.title}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Play button overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="h-4 w-4 fill-current translate-x-0.5" />
                  </span>
                </div>

                {/* Top badges on poster (ReelsDesk style) */}
                <div className="absolute top-2 start-2 end-2 flex items-center justify-between pointer-events-none z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white border border-white/10 shadow-xs">
                    <Flame className="h-2.5 w-2.5 text-orange-400" />
                    <span>Shorts</span>
                  </span>

                  {duration ? (
                    <span className="rounded-md bg-black/80 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-mono font-bold text-white">
                      {duration}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Bottom Card Body - compact height & theme adaptive */}
              <div className="flex flex-col p-3 gap-1.5 bg-card border-t border-border/50 flex-1 justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-orange-500 truncate tracking-wide max-w-[65%]">
                    {reel.channelTitle}
                  </span>
                  {reel.publishedAt ? (
                    <span className="text-[9.5px] text-muted-foreground font-semibold shrink-0">
                      <FrontWhen value={reel.publishedAt} />
                    </span>
                  ) : null}
                </div>

                <h3 className="text-xs font-semibold leading-[1.35] line-clamp-2 text-foreground group-hover:text-orange-500 transition-colors">
                  <bdi dir="auto">{reel.title}</bdi>
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
