'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { Play, Film, Camera, ChevronRight } from 'lucide-react';
import { pick } from '@/i18n/pick';
import type { YoutubeCard } from '@/lib/youtube/present';
import type { PhotoFrame } from '@/components/photos/PhotoHall';
import { ClientTime } from '@/components/datetime/ClientTime';

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
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-primary" />
            {pick(locale, 'سينما الملاعب', 'Cinema & Highlights')}
          </p>
          <h2 className="mt-0.5 text-xl font-black text-foreground">
            {pick(locale, 'أحدث الفيديوهات وملخصات المباريات', 'Latest Videos & Match Highlights')}
          </h2>
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
        {videos.slice(0, 4).map((video) => (
          <Link
            key={video.youtubeId}
            href={`/videos?v=${video.youtubeId}`}
            className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnailUrl || ''}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transform group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-current translate-x-0.5" />
                </span>
              </span>
            </div>
            <div className="p-3.5 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black">
                {video.channelTitle}
              </span>
              <h3 className="text-xs font-bold leading-5 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
      <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500 flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-red-500" />
            {pick(locale, 'لقطات سريعة', 'Shorts & Reels')}
          </p>
          <h2 className="mt-0.5 text-xl font-black text-foreground">
            {pick(locale, 'قسم الريلز واللقطات القصيرة', 'Reels & Moments')}
          </h2>
        </div>
        <Link
          href="/videos/reels"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
        >
          {pick(locale, 'كل الريلز', 'All reels')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {reels.slice(0, 4).map((reel) => (
          <Link
            key={reel.youtubeId}
            href={`/videos/reels?v=${reel.youtubeId}`}
            className="group relative block aspect-[9/14] overflow-hidden rounded-2xl border border-border/70 bg-black shadow-md transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reel.thumbnailUrl || ''}
              alt={reel.title}
              className="h-full w-full object-cover scale-100 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Top Badges */}
            <span className="absolute top-2.5 end-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/90 backdrop-blur-md text-[9px] font-black text-white shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              REELS
            </span>
            <span className="absolute top-2.5 start-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 backdrop-blur-md text-white group-hover:bg-primary group-hover:text-white transition-all shadow-md">
              <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
            </span>

            {/* Bottom Gradient & Text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-3.5 flex flex-col justify-end z-10 pointer-events-none">
              <span className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-black text-amber-300 w-fit">
                <Play className="h-2.5 w-2.5 fill-current" />
                {reel.channelTitle}
              </span>
              <h3
                className="text-xs font-black leading-snug line-clamp-2 drop-shadow-md transition-colors group-hover:text-amber-200"
                style={{ color: '#ffffff' }}
              >
                {reel.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
      <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary flex items-center gap-1.5">
            <Camera className="h-3 w-3" />
            {pick(locale, 'عدسة اليوم', 'Today in Pictures')}
          </p>
          <h2 className="mt-0.5 text-xl font-black text-foreground">
            {pick(locale, 'معرض صور وأحداث اليوم', 'Photo Gallery & Daily Events')}
          </h2>
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
        {photos.slice(0, 4).map((photo) => (
          <Link
            key={photo.id}
            href={`/news/${photo.slug}`}
            className="group block overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-xs transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image}
                alt={photo.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="pt-3 pb-1 px-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <span className="text-primary font-bold">
                  {photo.sourceName || pick(locale, 'مصور معتمد', 'Staff photo')}
                </span>
                {photo.publishedAt && (
                  <ClientTime value={new Date(photo.publishedAt)} options={{ month: 'short', day: 'numeric' }} />
                )}
              </div>
              <h3 className="text-xs font-bold leading-relaxed text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {photo.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
