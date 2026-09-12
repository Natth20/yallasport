'use client';

import { useEffect, useRef, useState } from 'react';
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
  onEnded
}: LicensedPlayerProps) {
  const t = useTranslations('watch');
  const { dataSaver } = useSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ShakaPlayer | null>(null);
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
        const mod = (await import('shaka-player')) as unknown as {
          default?: { polyfill: { installAll: () => void }; Player: { isBrowserSupported: () => boolean; new (video: HTMLVideoElement): ShakaPlayer } };
          polyfill?: { installAll: () => void };
          Player?: { isBrowserSupported: () => boolean; new (video: HTMLVideoElement): ShakaPlayer };
        };
        const shaka = mod.default ?? mod;
        if (!shaka.polyfill || !shaka.Player) {
          if (!destroyed) setError(t('unsupported'));
          return;
        }
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
          if (!destroyed) setError(t('unsupported'));
          return;
        }
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
        void protocol;
      } catch {
        if (!destroyed) setError(t('unsupported'));
      }
    };

    void start();
    return () => {
      destroyed = true;
      playerRef.current = null;
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

  const pickHeight = (height: number, track: VariantTrack) => {
    const player = playerRef.current;
    if (!player) return;
    player.configure({ abr: { enabled: false } });
    player.selectVariantTrack(track, true);
    setMode(height);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      <video ref={videoRef} className="h-full w-full flex-1" controls playsInline autoPlay />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 bg-black/92 px-3 py-2">
        <span className="me-1 text-[10px] font-semibold tracking-[0.16em] text-[#e8b48a]">{t('quality')}</span>
        <button
          type="button"
          onClick={pickAuto}
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            mode === 'auto' ? 'bg-[#c26a3a] text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'
          }`}
        >
          {t('quality_auto')}
        </button>
        {levels.map(([height, track]) => (
          <button
            key={height}
            type="button"
            onClick={() => pickHeight(height, track)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums ${
              mode === height ? 'bg-card text-foreground' : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {height}p
          </button>
        ))}
      </div>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6 text-center text-sm font-bold text-white">
          {error}
        </div>
      )}
    </div>
  );
}
