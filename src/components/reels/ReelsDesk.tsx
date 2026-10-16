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
  const playableInitial = useMemo(
    () => initialClips.filter((c) => !isBlockedChannel(c.channelId)),
    [initialClips]
  );
  const [clips, setClips] = useState(playableInitial);
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
    const valid = initialClips.filter((c) => !isBlockedChannel(c.channelId));
    setClips(valid);
    if (initialId && valid.some((c) => c.youtubeId === initialId)) {
      setSelectedId(initialId);
    } else if (initialId && !valid.some((c) => c.youtubeId === initialId)) {
      setSelectedId(valid[0]?.youtubeId || null);
    }
  }, [initialClips, initialId]);

  // Unique channel list (excluding blocked channels)
  const channelList = useMemo(() => {
    const map = new Map<string, string>();
    for (const clip of clips) {
      if (clip.channelId && !isBlockedChannel(clip.channelId)) {
        map.set(clip.channelId, clip.channelTitle);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [clips]);

  // Filtered visible clips
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clips.filter((clip) => {
      if (isBlockedChannel(clip.channelId)) return false;
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

  // Auto skip on iframe error (e.g. embed restricted)
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'onError' || data.info === 101 || data.info === 150)) {
          step(1);
        }
      } catch {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [visible, currentIndex]);

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
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0d14] text-white p-3.5 sm:p-5 shadow-2xl mb-6 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Player Header Bar */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-black shadow-md shadow-orange-500/30">
                <Smartphone size={15} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-orange-400 tracking-wide uppercase">
                    {ar ? 'مشغل الريلز المباشر' : 'Live Reels Theater'}
                  </span>
                  {typeof currentClip.durationSec === 'number' && currentClip.durationSec > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300 border border-white/10">
                      <Clock size={10} />
                      <span>{clock(currentClip.durationSec)}</span>
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xl">
                  {currentClip.title}
                </h2>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={closePlayer}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              title={ar ? 'إغلاق والعودة للمعرض' : 'Close player'}
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Stage & Side Actions: constrained height to fit viewports */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6">
            {/* The 9:16 Vertical Screen with screen-bounded height */}
            <div className="relative h-[min(54vh,460px)] aspect-[9/16] w-auto mx-auto shrink-0 rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/15">
              <iframe
                key={currentClip.youtubeId}
                src={embedSrc(currentClip.youtubeId, origin)}
                title={currentClip.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            {/* Sidebar Controls & Info */}
            <div className="flex flex-col justify-between w-full lg:max-w-md gap-3">
              {/* Channel & Details Box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md text-white">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <strong className="text-xs sm:text-sm font-bold text-white">{currentClip.channelTitle}</strong>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-semibold">
                    <ClientTime value={currentClip.publishedAt} />
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                  {currentClip.description || currentClip.title}
                </p>

                {/* Direct External Link */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <a
                    href={`https://www.youtube.com/shorts/${currentClip.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <span>{ar ? 'فتح في تطبيق يوتيوب شورتس' : 'Open in YouTube Shorts'}</span>
                    <ExternalLink size={12} />
                  </a>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/10 transition-all"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                    <span>{copied ? (ar ? 'تم النسخ!' : 'Copied!') : (ar ? 'مشاركة الرابط' : 'Share Link')}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={visible.length < 2}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 disabled:opacity-40"
                >
                  <ChevronRight size={16} className={ar ? 'rotate-180' : ''} />
                  <span>{ar ? 'الريل السابق' : 'Previous Reel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={visible.length < 2}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/25 disabled:opacity-40"
                >
                  <span>{ar ? 'الريل التالي' : 'Next Reel'}</span>
                  <ChevronLeft size={16} className={ar ? 'rotate-180' : ''} />
                </button>
              </div>

              {/* Up Next Mini Shelf */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-neutral-400">
                  {ar ? 'التالي في قائمة الريلز:' : 'Up Next in Reels:'}
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {visible.slice(currentIndex + 1, currentIndex + 6).map((next) => (
                    <button
                      key={next.youtubeId}
                      type="button"
                      onClick={() => playReel(next.youtubeId)}
                      className="group relative flex h-20 w-14 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black text-start transition-transform hover:scale-105"
                    >
                      {next.thumbnailUrl ? (
                        <img
                          src={next.thumbnailUrl}
                          alt={next.title}
                          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : null}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                      <span className="absolute bottom-1 start-1 end-1 text-[8.5px] font-medium text-white line-clamp-1">
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
                {/* 4:5 Aspect Ratio Poster - modern, compact & elegant */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 rounded-2xl">
                  {clip.thumbnailUrl ? (
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-muted/40">
                      <Smartphone size={28} className="text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Gradient shade overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10 pointer-events-none" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/40 transform scale-75 group-hover:scale-100 transition-transform">
                      <Play size={18} fill="currentColor" className="translate-x-0.5" />
                    </span>
                  </div>

                  {/* Top badges */}
                  <div className="absolute top-2 start-2 end-2 flex items-center justify-between pointer-events-none z-10">
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
                  <div className="absolute bottom-2 start-2 end-2 flex flex-col gap-0.5 pointer-events-none z-10">
                    <span className="text-[10px] font-bold text-orange-400 truncate tracking-wide">
                      {clip.channelTitle}
                    </span>
                    <h3
                      className="text-[0.74rem] sm:text-[0.76rem] font-semibold leading-[1.35] line-clamp-2 drop-shadow-sm"
                      style={{ color: '#ffffff' }}
                    >
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
