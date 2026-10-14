'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { YOUTUBE_EMBED_BLOCKED } from '@/lib/youtube/channels';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  ExternalLink,
  Share2,
  Check,
  Film,
  Flame,
  Radio,
  Sparkles,
  Smartphone,
  Eye,
  Clock,
  RotateCcw,
} from 'lucide-react';
import type { YoutubeClipCard, YoutubeCopy } from '../youtube/YoutubeDesk';

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function embedSrc(youtubeId: string, origin?: string) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    autoplay: '1',
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

function isBlockedChannel(channelId?: string) {
  return Boolean(channelId && YOUTUBE_EMBED_BLOCKED.has(channelId));
}

export function ReelsDesk({
  locale,
  clips: initialClips,
  initialId,
  copy,
  empty,
}: {
  locale: string;
  clips: YoutubeClipCard[];
  initialId?: string | null;
  copy: YoutubeCopy;
  empty: string;
}) {
  const [clips, setClips] = useState(initialClips);
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);
  const [channel, setChannel] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const playerModalRef = useRef<HTMLDivElement>(null);
  const ar = locale === 'ar';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    setClips(initialClips);
    if (initialId && initialClips.some((c) => c.youtubeId === initialId)) {
      setSelectedId(initialId);
    }
  }, [initialClips, initialId]);

  // Unique channel list
  const channelList = useMemo(() => {
    const map = new Map<string, string>();
    for (const clip of clips) {
      if (clip.channelId) map.set(clip.channelId, clip.channelTitle);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [clips]);

  // Filtered visible clips
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clips.filter((clip) => {
      if (channel !== 'ALL' && clip.channelId !== channel) return false;
      if (!q) return true;
      return `${clip.title} ${clip.channelTitle}`.toLowerCase().includes(q);
    });
  }, [channel, clips, query]);

  // Currently playing clip
  const currentClip = useMemo(() => {
    if (!selectedId) return null;
    return clips.find((c) => c.youtubeId === selectedId) || null;
  }, [clips, selectedId]);

  const currentIndex = useMemo(() => {
    if (!currentClip) return -1;
    return visible.findIndex((c) => c.youtubeId === currentClip.youtubeId);
  }, [currentClip, visible]);

  // Open a specific reel in the in-page theater
  function playReel(id: string) {
    setSelectedId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('v', id);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }

  // Close player and return to grid feed
  function closePlayer() {
    setSelectedId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('v');
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }

  // Next / Previous Reel
  function step(delta: number) {
    if (visible.length < 2) return;
    const baseIdx = currentIndex >= 0 ? currentIndex : 0;
    const nextIdx = (baseIdx + delta + visible.length) % visible.length;
    const nextClip = visible[nextIdx];
    if (nextClip) {
      playReel(nextClip.youtubeId);
    }
  }

  // Keyboard navigation when player is open
  useEffect(() => {
    if (!selectedId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePlayer();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, currentIndex, visible]);

  // Copy share link
  function handleShare() {
    if (typeof window === 'undefined' || !selectedId) return;
    const url = `${window.location.origin}${window.location.pathname}?v=${selectedId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ----------------- TOP SEARCH & CHANNEL FILTER BAR ----------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-xl shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? 'ابحث في الريلز واللقطات القصيرة...' : 'Search reels and shorts...'}
            className="w-full h-10 ps-9 pe-9 rounded-xl bg-muted/40 border border-border/50 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Channel selector */}
        <div className="flex items-center gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="h-10 px-3 rounded-xl bg-muted/40 border border-border/50 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all cursor-pointer"
          >
            <option value="ALL">{ar ? 'جميع القنوات والمصادر' : 'All Channels'}</option>
            {channelList.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-black border border-orange-500/20 whitespace-nowrap">
            <Flame size={14} />
            <span>
              {visible.length} {ar ? 'مقطع ريلز' : 'Reels'}
            </span>
          </span>
        </div>
      </div>

      {/* ----------------- IN-PAGE IMMERSIVE REELS THEATER (WHEN PLAYING) ----------------- */}
      {currentClip ? (
        <div
          ref={playerModalRef}
          className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-b from-card via-black/90 to-card p-4 sm:p-7 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300"
        >
          {/* Ambient colored backdrop glow */}
          <div className="absolute -top-32 -start-32 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -end-32 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl pointer-events-none" />

          {/* Player Header Bar */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-4 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-black shadow-md shadow-orange-500/30">
                <Smartphone size={16} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-orange-500 tracking-wide uppercase">
                    {ar ? 'مشغل الريلز العمودي' : 'Vertical Reels Player'}
                  </span>
                  {typeof currentClip.durationSec === 'number' && currentClip.durationSec > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border/40">
                      <Clock size={10} />
                      <span>{clock(currentClip.durationSec)}</span>
                    </span>
                  ) : null}
                </div>
                <h2 className="text-sm sm:text-base font-black text-foreground truncate max-w-xl">
                  {currentClip.title}
                </h2>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={closePlayer}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/60"
              title={ar ? 'إغلاق والعودة للمعرض' : 'Close player'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Stage & Side Actions */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6">
            {/* The 9:16 Vertical Screen */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 shrink-0">
              {isBlockedChannel(currentClip.channelId) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/95">
                  <Flame size={36} className="text-orange-500 mb-3 animate-pulse" />
                  <p className="text-sm font-black text-white mb-2">
                    {ar ? 'هذا المقطع محمي من القناة الرسمية' : 'This reel is embed-protected by the channel'}
                  </p>
                  <p className="text-xs text-neutral-400 mb-4">
                    {ar
                      ? 'القناة تطلب فتح هذا المقطع مباشرة على يوتيوب لضمان حقوق النشر.'
                      : 'The channel requests viewing directly on YouTube.'}
                  </p>
                  <a
                    href={`https://www.youtube.com/watch?v=${currentClip.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg"
                  >
                    <span>{ar ? 'مشاهدة المقطع على يوتيوب' : 'Watch on YouTube'}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <iframe
                  key={currentClip.youtubeId}
                  src={embedSrc(currentClip.youtubeId, origin)}
                  title={currentClip.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )}
            </div>

            {/* Sidebar Controls & Info */}
            <div className="flex flex-col justify-between w-full lg:max-w-md gap-4">
              {/* Channel & Details Box */}
              <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <strong className="text-sm font-black text-foreground">{currentClip.channelTitle}</strong>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    <ClientTime value={currentClip.publishedAt} />
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {currentClip.description || currentClip.title}
                </p>

                {/* Direct External Link */}
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <a
                    href={`https://www.youtube.com/shorts/${currentClip.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <span>{ar ? 'فتح في تطبيق يوتيوب شورتس' : 'Open in YouTube Shorts'}</span>
                    <ExternalLink size={12} />
                  </a>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold text-foreground border border-border/50 transition-all"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                    <span>{copied ? (ar ? 'تم النسخ!' : 'Copied!') : (ar ? 'مشاركة الرابط' : 'Share Link')}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 bg-card/70">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={visible.length < 2}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/60 hover:bg-orange-500 hover:text-white text-xs font-black transition-all disabled:opacity-40"
                >
                  <ChevronRight size={16} className={ar ? 'rotate-180' : ''} />
                  <span>{ar ? 'الريل السابق' : 'Previous Reel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={visible.length < 2}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 disabled:opacity-40"
                >
                  <span>{ar ? 'الريل التالي' : 'Next Reel'}</span>
                  <ChevronLeft size={16} className={ar ? 'rotate-180' : ''} />
                </button>
              </div>

              {/* Up Next Mini Shelf */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {ar ? 'التالي في قائمة الريلز:' : 'Up Next in Reels:'}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {visible.slice(currentIndex + 1, currentIndex + 6).map((next) => (
                    <button
                      key={next.youtubeId}
                      type="button"
                      onClick={() => playReel(next.youtubeId)}
                      className="group relative flex h-24 w-16 shrink-0 rounded-xl overflow-hidden border border-border/60 bg-black text-start transition-transform hover:scale-105"
                    >
                      {next.thumbnailUrl ? (
                        <img
                          src={next.thumbnailUrl}
                          alt={next.title}
                          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : null}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-1 start-1 end-1 text-[9px] font-bold text-white line-clamp-1">
                        {next.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ----------------- REELS GRID SHOWCASE FEED ----------------- */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-dashed border-border/70 p-6 bg-card/40">
          <Smartphone size={32} className="text-muted-foreground/60 mb-3" />
          <strong className="text-base font-black text-foreground mb-1">{empty}</strong>
          <p className="text-xs text-muted-foreground max-w-md">
            {ar ? 'جرب البحث بكلمات أخرى أو اختر قناة رياضية مختلفة.' : 'Try adjusting your search query or channel filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {visible.map((clip) => {
            const isPlaying = currentClip?.youtubeId === clip.youtubeId;
            return (
              <div
                key={clip.youtubeId}
                onClick={() => playReel(clip.youtubeId)}
                className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                  isPlaying
                    ? 'border-orange-500 shadow-xl shadow-orange-500/20 ring-2 ring-orange-500/40 scale-[1.02]'
                    : 'border-border/70 bg-card/80 hover:border-orange-500/50 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* 9:16 Aspect Ratio Poster */}
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-neutral-900">
                  {clip.thumbnailUrl ? (
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/40">
                      <Smartphone size={28} className="text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Gradient shade overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/40 transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={20} fill="currentColor" className="translate-x-0.5" />
                    </span>
                  </div>

                  {/* Top badges */}
                  <div className="absolute top-2 start-2 end-2 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
                      <Flame size={10} className="text-orange-400" />
                      <span>Shorts</span>
                    </span>

                    {typeof clip.durationSec === 'number' && clip.durationSec > 0 ? (
                      <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
                        {clock(clip.durationSec)}
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom info on the card */}
                  <div className="absolute bottom-2.5 start-2.5 end-2.5 flex flex-col gap-1 pointer-events-none">
                    <span className="text-[10px] font-bold text-orange-400 truncate">
                      {clip.channelTitle}
                    </span>
                    <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 drop-shadow-sm">
                      {clip.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
