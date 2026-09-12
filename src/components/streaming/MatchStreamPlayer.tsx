'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LicensedPlayer } from './LicensedPlayer';
import { Link } from '@/i18n/navigation';

interface PlaybackPayload {
  manifestUrl: string;
  protocol: 'HLS' | 'DASH';
  drmType: 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';
  licenseUrl?: string | null;
  expiresAt: string;
}

const ERROR_MAP: Record<string, string> = {
  unauthorized: 'sign_in',
  geo_blocked: 'geo',
  entitlement_required: 'entitlement',
  outside_window: 'window',
  provider_unconfigured: 'provider',
  streaming_disabled: 'unavailable',
  license_inactive: 'unavailable',
  asset_unavailable: 'unavailable'
};

export function MatchStreamPlayer({ assetId }: { assetId: string }) {
  const t = useTranslations('watch');
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      const response = await fetch('/api/stream/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPlayback(null);
        setErrorKey(ERROR_MAP[data.error] || 'unavailable');
        return;
      }
      setPlayback(data);
    } catch {
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
      <div className="relative flex aspect-video w-full items-center justify-center bg-background">
        <span className="broadcast-snow" />
        <div className="relative h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (!playback || errorKey) {
    const key = errorKey || 'unavailable';
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center bg-background p-10 text-center">
        <span className="broadcast-snow" />
        <div className="relative mb-5 rounded-full border border-white/10 bg-white/5 p-5">
          {key === 'sign_in' ? <AlertCircle className="h-10 w-10 text-primary" /> : <Lock className="h-10 w-10 text-white/35" />}
        </div>
        <h3 className="relative text-xl font-black text-white">{t(key)}</h3>
        <div className="relative mt-6 flex gap-3">
          {key === 'sign_in' ? (
            <Link href="/login" className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-white">
              {t('sign_in')}
            </Link>
          ) : (
            <button type="button" onClick={() => void load()} className="rounded-xl border border-white/15 px-5 py-2 text-xs font-black text-white">
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
      <LicensedPlayer
        manifestUrl={playback.manifestUrl}
        protocol={playback.protocol}
        drmType={playback.drmType}
        licenseUrl={playback.licenseUrl}
        onEnded={() => setErrorKey('session_expired')}
      />
    </div>
  );
}
