'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { DataFreshness, LiveMatchesPayload, NormalizedMatch } from '@/lib/sports-data/types';
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
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [matches, setMatches] = useState<NormalizedMatch[]>([]);
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const applyPayload = (payload: LiveMatchesPayload) => {
      if (disposed) return;
      setMatches(payload.matches.map((match) => ({ ...match, kickoffAt: new Date(match.kickoffAt) })));
      setFreshness(payload.freshness);
      const syncedAt = payload.freshness.syncedAt;
      const age = syncedAt ? (Date.now() - new Date(syncedAt).getTime()) / 1000 : Number.POSITIVE_INFINITY;
      setConnection(age > payload.freshness.staleAfterSeconds ? 'degraded' : 'connected');
    };

    const poll = async () => {
      if (!navigator.onLine) {
        setConnection('offline');
        return;
      }
      try {
        const response = await fetch('/api/sports/live', { cache: 'no-store' });
        if (!response.ok) throw new Error('Live endpoint unavailable');
        applyPayload(await response.json());
      } catch {
        setConnection('degraded');
      }
    };

    const handleOnline = () => {
      setConnection('reconnecting');
      void poll();
    };
    const handleOffline = () => setConnection('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void poll();
    if (!dataSaver && 'EventSource' in window) {
      eventSource = new EventSource('/api/sports/live/stream');
      eventSource.addEventListener('open', () => setConnection('connected'));
      eventSource.addEventListener('matches', (event) => {
        applyPayload(JSON.parse((event as MessageEvent).data));
      });
      eventSource.addEventListener('error', () => setConnection(navigator.onLine ? 'reconnecting' : 'offline'));
    } else {
      pollTimer = setInterval(poll, dataSaver ? 60000 : 30000);
    }

    return () => {
      disposed = true;
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dataSaver]);

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
