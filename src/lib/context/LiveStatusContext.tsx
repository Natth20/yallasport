'use client';
import { reportCaughtError } from '@/lib/ops/caught';


import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import type { DataFreshness, LiveMatchesPayload, NormalizedMatch } from '@/lib/sports-data/types';
import { walkLocalizeNames } from '@/lib/i18n/sports-lexicon';
import { useSettings } from './SettingsContext';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'degraded';

interface LiveStatusContextValue {
  connection: ConnectionState;
  matches: NormalizedMatch[];
  freshness: DataFreshness | null;
}

const LiveStatusContext = createContext<LiveStatusContextValue | undefined>(undefined);

export function LiveStatusProvider({ children }: { children: React.ReactNode }) {
  const { dataSaver } = useSettings();
  const locale = useLocale();
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [matches, setMatches] = useState<NormalizedMatch[]>([]);
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const applyPayload = (payload: LiveMatchesPayload) => {
      if (disposed) return;
      const next = payload.matches.map((match) => ({ ...match, kickoffAt: new Date(match.kickoffAt) }));
      walkLocalizeNames(locale, next);
      setMatches(next);
      setFreshness(payload.freshness);
      const syncedAt = payload.freshness.syncedAt;
      const age = syncedAt ? (Date.now() - new Date(syncedAt).getTime()) / 1000 : Number.POSITIVE_INFINITY;
      setConnection(age > payload.freshness.staleAfterSeconds ? 'degraded' : 'connected');
    };

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!navigator.onLine) {
        setConnection('offline');
        return;
      }
      try {
        const response = await fetch('/api/sports/live', { cache: 'no-store' });
        if (!response.ok) throw new Error('Live endpoint unavailable');
        applyPayload(await response.json());
      } catch (error) {
        reportCaughtError("src/lib/context/LiveStatusContext.tsx:51", error, { persist: false });
        setConnection('degraded');
        setFreshness((current) =>
          current
            ? { ...current, source: current.source === 'LIVE' ? 'CACHE' : current.source }
            : current,
        );
      }
    };

    const handleOnline = () => {
      setConnection('reconnecting');
      void poll();
    };
    const handleOffline = () => setConnection('offline');
    const attachLiveStream = () => {
      if (dataSaver || !('EventSource' in window) || eventSource) return;
      eventSource = new EventSource('/api/sports/live/stream');
      eventSource.addEventListener('open', () => setConnection('connected'));
      eventSource.addEventListener('matches', (event) => {
        if (document.hidden) return;
        applyPayload(JSON.parse((event as MessageEvent).data));
      });
      eventSource.addEventListener('error', () => setConnection(navigator.onLine ? 'reconnecting' : 'offline'));
    };

    const handleVisibility = () => {
      if (document.hidden) {
        eventSource?.close();
        eventSource = null;
        return;
      }
      attachLiveStream();
      void poll();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    void poll();
    if (!dataSaver && 'EventSource' in window) {
      attachLiveStream();
    } else {
      pollTimer = setInterval(poll, dataSaver ? 60000 : 30000);
    }

    return () => {
      disposed = true;
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [dataSaver, locale]);

  const value = useMemo(() => ({ connection, matches, freshness }), [connection, matches, freshness]);
  return <LiveStatusContext.Provider value={value}>{children}</LiveStatusContext.Provider>;
}

const DEFAULT_LIVE_STATUS: LiveStatusContextValue = {
  connection: 'connected',
  matches: [],
  freshness: null,
};

export function useLiveStatus() {
  const context = useContext(LiveStatusContext);
  return context ?? DEFAULT_LIVE_STATUS;
}
