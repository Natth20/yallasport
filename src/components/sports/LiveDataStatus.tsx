'use client';

import { CloudOff, Database, Loader2, Radio } from 'lucide-react';
import { useLiveStatus } from '@/lib/context/LiveStatusContext';
import { useSettings } from '@/lib/context/SettingsContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { formatKickoff } from '@/lib/datetime/format';

export function LiveDataStatus() {
  const { language, t } = useLanguage();
  const { connection, freshness } = useLiveStatus();
  const { timezone, dataSaver } = useSettings();

  const config = connection === 'offline'
    ? { icon: CloudOff, dot: 'bg-slate-400', text: t('sports.offline') }
    : connection === 'degraded'
      ? { icon: Database, dot: 'bg-amber-500', text: t('sports.degraded') }
      : connection === 'connecting' || connection === 'reconnecting'
        ? { icon: Loader2, dot: 'bg-amber-500', text: t('sports.reconnecting') }
        : { icon: Radio, dot: 'bg-emerald-500', text: t('sports.connected') };
  const Icon = config.icon;
  const syncedAt = freshness?.syncedAt
    ? formatKickoff(freshness.syncedAt, timezone, language)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${connection === 'connected' ? 'animate-pulse' : ''}`} />
        <Icon className={`h-3.5 w-3.5 ${connection === 'reconnecting' ? 'animate-spin' : ''}`} />
        {freshness?.source === 'MOCK' || freshness?.source === 'EMPTY' ? t('sports.ledger_only') : config.text}
      </span>
      {syncedAt && <span>{t('sports.last_updated', { time: syncedAt })}</span>}
      {dataSaver && <span>{t('sports.data_saver_refresh')}</span>}
    </div>
  );
}
