'use client';
import { reportCaughtError, swallow } from '@/lib/ops/caught';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/lib/context/SettingsContext';
import { networkMaxHeight } from '@/lib/streaming/network-cap';

type DrmType = 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';

type VariantTrack = {
  id: number;
  height: number | null;
  bandwidth: number;
  active: boolean;
};

type ShakaPlayer = {
  destroy: () => Promise<unknown>;
  configure: (config: Record<string, unknown>) => void;
  addEventListener: (name: string, handler: () => void) => void;
  removeEventListener: (name: string, handler: () => void) => void;
  load: (uri: string) => Promise<void>;
  getVariantTracks: () => VariantTrack[];
  selectVariantTrack: (track: VariantTrack, clearBuffer?: boolean) => void;
};

interface LicensedPlayerProps {
  manifestUrl: string;
  protocol: 'HLS' | 'DASH';
  drmType: DrmType;
  licenseUrl?: string | null;
  onEnded?: () => void;
}

function ladder(tracks: VariantTrack[]) {
  const best = new Map<number, VariantTrack>();
  for (const track of tracks) {
    if (!track.height) continue;
    const previous = best.get(track.height);
    if (!previous || track.bandwidth > previous.bandwidth) best.set(track.height, track);
  }
  return [...best.entries()].sort((first, second) => first[0] - second[0]);
}

export function LicensedPlayer({
  manifestUrl,
  protocol,
  drmType,
  licenseUrl,
  onEnded,
}: LicensedPlayerProps) {
  const t = useTranslations('watch');
  const { dataSaver } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ShakaPlayer | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Array<[number, VariantTrack]>>([]);
  const [mode, setMode] = useState<'auto' | number>('auto');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    let player: ShakaPlayer | null = null;

    const start = async () => {
      try {
        // Fast path: for non-DRM HLS streams, use Hls.js for rock-solid playback across all browsers
        if (drmType === 'NONE' && (protocol === 'HLS' || manifestUrl.includes('.m3u8'))) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsRef.current = hls;
            hls.loadSource(manifestUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch((error) => {
                reportCaughtError('licensed-player:autoplay', error, { persist: false });
                video.muted = true;
                video.play().catch((retryError) => {
                  reportCaughtError('licensed-player:muted-autoplay', retryError, { persist: false });
                });
              });
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                hls.destroy();
                video.src = manifestUrl;
                video.play().catch(swallow("src/components/streaming/LicensedPlayer.tsx:90", null, { persist: false }));
              }
            });
            return;
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = manifestUrl;
            video.play().catch(swallow("src/components/streaming/LicensedPlayer.tsx:96", null, { persist: false }));
            return;
          }
        }

        const mod = (await import('shaka-player')) as unknown as {
          default?: {
            polyfill: { installAll: () => void };
            Player: {
              isBrowserSupported: () => boolean;
              new (video: HTMLVideoElement): ShakaPlayer;
            };
          };
          polyfill?: { installAll: () => void };
          Player?: {
            isBrowserSupported: () => boolean;
            new (video: HTMLVideoElement): ShakaPlayer;
          };
        };

        const shaka = mod.default ?? mod;
        if (shaka?.polyfill) {
          shaka.polyfill.installAll();
        }

        if (shaka?.Player?.isBrowserSupported()) {
          player = new shaka.Player(video);
          playerRef.current = player;
          const cap = networkMaxHeight();
          player.configure({
            abr: {
              enabled: true,
              restrictions: cap ? { maxHeight: cap } : {},
            },
          });

          if (drmType !== 'NONE' && licenseUrl) {
            const servers: Record<string, string> = {};
            if (drmType === 'WIDEVINE') servers['com.widevine.alpha'] = licenseUrl;
            if (drmType === 'PLAYREADY') servers['com.microsoft.playready'] = licenseUrl;
            if (drmType === 'FAIRPLAY') servers['com.apple.fps'] = licenseUrl;
            player.configure({ drm: { servers } });
          }

          const refresh = () => {
            if (destroyed || !player) return;
            setLevels(ladder(player.getVariantTracks()));
          };

          player.addEventListener('ended', () => onEnded?.());
          player.addEventListener('adaptation', refresh);
          await player.load(manifestUrl);
          refresh();
          return;
        }

        // Native Safari/HLS fallback
        if (video.canPlayType('application/vnd.apple.mpegurl') || manifestUrl.includes('.m3u8')) {
          video.src = manifestUrl;
          video.play().catch(swallow("src/components/streaming/LicensedPlayer.tsx:155", null, { persist: false }));
          return;
        }

        if (!destroyed) setError(t('unsupported'));
      } catch (error) {
        reportCaughtError('licensed-player:start', error, { persist: false });
        if (video) {
          video.src = manifestUrl;
          video.play().catch(swallow("src/components/streaming/LicensedPlayer.tsx:164", null, { persist: false }));
        }
      }
    };

    void start();
    return () => {
      destroyed = true;
      playerRef.current = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      void player?.destroy();
    };
  }, [manifestUrl, protocol, drmType, licenseUrl, onEnded, t]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || mode !== 'auto') return;
    const cap = networkMaxHeight();
    player.configure({
      abr: {
        enabled: true,
        restrictions: cap ? { maxHeight: cap } : {},
      },
    });
  }, [dataSaver, mode]);

  const pickAuto = () => {
    const player = playerRef.current;
    if (!player) return;
    const cap = networkMaxHeight();
    player.configure({
      abr: {
        enabled: true,
        restrictions: cap ? { maxHeight: cap } : {},
      },
    });
    setMode('auto');
  };

  const pickTrack = (track: VariantTrack) => {
    const player = playerRef.current;
    if (!player) return;
    player.configure({ abr: { enabled: false } });
    player.selectVariantTrack(track, true);
    setMode(track.height ?? 'auto');
  };

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-black p-6 text-center text-xs text-white">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black group">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls
        playsInline
        autoPlay
        muted
      />

      {levels.length > 0 && (
        <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex items-center gap-1 rounded-xl bg-black/75 p-1 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white">
            <button
              type="button"
              onClick={pickAuto}
              className={`rounded-lg px-2 py-0.5 transition-all ${
                mode === 'auto' ? 'bg-primary text-white' : 'hover:bg-white/10'
              }`}
            >
              {t('quality_auto')}
            </button>
            {levels.map(([h, track]) => (
              <button
                key={h}
                type="button"
                onClick={() => pickTrack(track)}
                className={`rounded-lg px-2 py-0.5 transition-all ${
                  mode === h ? 'bg-primary text-white' : 'hover:bg-white/10'
                }`}
              >
                {h}p
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
