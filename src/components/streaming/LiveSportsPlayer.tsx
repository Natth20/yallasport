'use client';

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Tv, Radio, Sparkles, Flame, Clock, Maximize, RotateCcw, ShieldCheck, Layers, Wifi } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface StreamChannel {
  id: string;
  name: string;
  country: string;
  kind: string;
  logoUrl: string;
  protocol: string;
  status: string;
  liveHlsUrl: string;
  description: string;
  bitrate: string;
  /**
   * Optional list of quality variants. If omitted, the single liveHlsUrl is used.
   */
  qualities?: { label: string; url: string }[];
}

export function LiveSportsPlayer({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = auto
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // 1. Fetch live channels from API
  useEffect(() => {
    async function fetchLiveStreams() {
      try {
        const res = await fetch('/api/stream/live');
        const data = await res.json();
        if (data.ok && data.channels?.length > 0) {
          setChannels(data.channels);
          setActiveChannel(data.channels[0]);
        }
      } catch (err) {
        console.error('Error loading live streams:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveStreams();
  }, []);

  // 2. Attach HLS.js or native player when activeChannel changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel?.liveHlsUrl) return;

    setStreamError(null);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = activeChannel.liveHlsUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Autoplay policy might require muted
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try proxy if direct failed
              if (!url.includes('/api/stream/proxy')) {
                const proxyUrl = `/api/stream/proxy?url=${encodeURIComponent(url)}`;
                hls.loadSource(proxyUrl);
                hls.startLoad();
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setStreamError(isAr ? 'تعذر استلام إشارة القناة حالياً' : 'Stream connection interrupted');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari / iOS
      video.src = url;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => null);
      });
    } else {
      setStreamError(isAr ? 'المتصفح لا يدعم بث HLS المباشر' : 'HLS playback not supported');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, isAr]);

  const handleSelectChannel = (ch: StreamChannel) => {
    setActiveChannel(ch);
    setHasUserInteracted(true);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => null);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleReload = () => {
    if (activeChannel) {
      const current = activeChannel;
      setActiveChannel(null);
      setTimeout(() => setActiveChannel(current), 100);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-card/95 via-card/85 to-card/95 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl shadow-primary/10">
      {/* Background Lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

      {/* Top Bar: Channel Header & Live Status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-orange-500 text-white shadow-lg shadow-primary/30">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black uppercase text-white shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                LIVE ON AIR
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                <Wifi className="h-3 w-3" />
                {activeChannel?.bitrate || '1080p 60FPS'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground mt-0.5">
              {activeChannel?.name || (isAr ? 'البث المباشر الرياضي' : 'Live Sports Broadcast')}
            </h2>
          </div>
        </div>

        {/* Channels Quick Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSelectChannel(ch)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                activeChannel?.id === ch.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${activeChannel?.id === ch.id ? 'text-white' : 'text-primary'}`} />
              <span>{ch.name.split('•')[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Player Box */}
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black border border-white/15 shadow-2xl group">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black/90 p-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary/30 border-t-primary" />
            <p className="mt-4 text-xs font-bold text-muted-foreground">
              {isAr ? 'جاري الاتصال بسيرفر البث المباشر...' : 'Connecting to live sports server...'}
            </p>
          </div>
        ) : streamError ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black/95 p-6 text-center">
            <Radio className="h-10 w-10 text-red-400 mb-3 animate-pulse" />
            <p className="text-sm font-black text-white">{streamError}</p>
            <button
              type="button"
              onClick={handleReload}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              autoPlay
              playsInline
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Unmute prompt banner if browser muted by policy */}
            {isMuted && isPlaying && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-4 start-4 z-30 flex items-center gap-2 rounded-2xl bg-black/80 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/20 hover:bg-primary transition-all animate-bounce"
              >
                <VolumeX className="h-4 w-4 text-primary group-hover:text-white" />
                <span>{isAr ? 'اضغط لإلغاء كتم الصوت 🔊' : 'Click to Unmute 🔊'}</span>
              </button>
            )}

            {/* Top Right Channel Watermark Logo */}
            <div className="pointer-events-none absolute top-4 end-4 z-20 flex items-center gap-2 rounded-2xl bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/10 opacity-90">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-black text-white">{activeChannel?.name?.split('•')[0]}</span>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-primary transition-all"
                  aria-label="Play/Pause"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-primary transition-all"
                  aria-label="Mute/Unmute"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <span className="hidden sm:inline-block text-xs font-black text-white/80">
                  {activeChannel?.country}
                </span>
              </div>

              {/* Quality Slider */}
              {activeChannel?.qualities && activeChannel.qualities.length > 1 && (
                <div className="flex items-center gap-2 text-xs text-white">
                  <label className="font-black">جودة:</label>
                  <input
                    type="range"
                    min={0}
                    max={activeChannel.qualities.length - 1}
                    value={selectedQuality >= 0 ? selectedQuality : activeChannel.qualities.length - 1}
                    onChange={(e) => setSelectedQuality(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="font-bold">
                    {selectedQuality >= 0
                      ? activeChannel.qualities[selectedQuality].label
                      : 'Auto'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReload}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/30 transition-all"
                  title={isAr ? 'تحديث البث' : 'Reload Stream'}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/30 transition-all"
                  aria-label="Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Channel Details & Description */}
      {activeChannel && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-primary">● {isAr ? 'بث فضائي مشفر/مفتوح' : 'Satellite Feed'}</span>
              <span className="text-[11px] text-muted-foreground">| {activeChannel.bitrate}</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed max-w-2xl">
              {activeChannel.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/live"
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-primary transition-all"
            >
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'جدول مباريات اليوم' : 'Today Matches'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
