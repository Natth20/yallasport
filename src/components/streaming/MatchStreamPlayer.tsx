'use client';
import { swallow, reportCaughtError } from '@/lib/ops/caught';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Lock, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const LicensedPlayer = dynamic(
  () => import('./LicensedPlayer').then((mod) => mod.LicensedPlayer),
  { ssr: false }
);

interface PlaybackPayload {
  manifestUrl: string;
  protocol: 'HLS' | 'DASH';
  drmType: 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';
  licenseUrl?: string | null;
  expiresAt?: string;
  channelName?: string;
}

const ERROR_MAP: Record<string, string> = {
  unauthorized: 'sign_in',
  geo_blocked: 'geo',
  entitlement_required: 'entitlement',
  outside_window: 'window',
  provider_unconfigured: 'provider',
  streaming_disabled: 'unavailable',
  license_inactive: 'unavailable',
  asset_unavailable: 'unavailable',
};

export function MatchStreamPlayer({ assetId }: { assetId: string }) {
  const t = useTranslations('watch');
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    setPlayback(null);
    try {
      const response = await fetch('/api/stream/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });

      const data = await response.json().catch(swallow("src/components/streaming/MatchStreamPlayer.tsx:51", ({}), { persist: false }));

      if (response.ok && typeof data.manifestUrl === 'string' && data.manifestUrl.length > 0) {
        setPlayback({
          manifestUrl: data.manifestUrl,
          protocol: data.protocol === 'DASH' ? 'DASH' : 'HLS',
          drmType: data.drmType || 'NONE',
          licenseUrl: data.licenseUrl,
          expiresAt: data.expiresAt,
          channelName: data.channelName,
        });
        return;
      }

      setErrorKey(ERROR_MAP[data.error] || 'unavailable');
    } catch (error) {
      reportCaughtError("src/components/streaming/MatchStreamPlayer.tsx:67", error, { persist: false });
      setErrorKey('unavailable');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-black/90 p-6 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/20 p-2">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/30 border-t-primary" />
          <Radio className="absolute h-4 w-4 animate-pulse text-primary" />
        </div>
        <p className="mt-4 text-xs font-bold text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  if (!playback) {
    const key = errorKey || 'unavailable';
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-black/95 p-8 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          {key === 'sign_in' ? (
            <AlertCircle className="h-8 w-8 text-primary" />
          ) : (
            <Lock className="h-8 w-8 text-white/40" />
          )}
        </div>
        <h3 className="text-lg font-black text-white">{t(key)}</h3>
        <div className="mt-5 flex gap-3">
          {key === 'sign_in' ? (
            <Link
              href="/login"
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/30"
            >
              {t('sign_in')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black text-white hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('retry')}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <LicensedPlayer
        manifestUrl={playback.manifestUrl}
        protocol={playback.protocol}
        drmType={playback.drmType}
        licenseUrl={playback.licenseUrl}
      />
    </div>
  );
}
