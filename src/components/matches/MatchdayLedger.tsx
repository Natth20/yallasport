import { MapPin, Radio, Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';

export async function MatchdayLedger({
  census,
  grounds,
  broadcasts,
  hrefForChannel,
  activeChannel,
}: {
  census: Array<{ label: string; value: number; tone?: 'goal' | 'yellow' | 'red' | 'sub' }>;
  grounds: Array<{ name: string; city?: string; count: number }>;
  broadcasts: Array<{ name: string; logoUrl?: string | null; count: number }>;
  hrefForChannel?: (name: string) => string;
  activeChannel?: string;
}) {
  const t = await getTranslations('sports');
  const visibleCensus = census.filter((item) => item.value > 0);
  if (visibleCensus.length === 0 && grounds.length === 0 && broadcasts.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {visibleCensus.length > 0 && (
        <section className="rounded-3xl border border-emerald-900/10 bg-card p-5 dark:border-emerald-400/10 dark:bg-muted">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-foreground">
            <Trophy className="h-3.5 w-3.5 text-orange-500" />
            {t('daily_tally')}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {visibleCensus.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl px-3 py-3 ${
                  item.tone === 'yellow'
                    ? 'bg-amber-50 dark:bg-amber-500/10'
                    : item.tone === 'red'
                      ? 'bg-red-50 dark:bg-red-500/10'
                      : item.tone === 'goal'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10'
                        : 'bg-emerald-950/5 dark:bg-card/[0.04]'
                }`}
              >
                <strong className={`block text-xl font-black tabular-nums ${
                  item.tone === 'yellow'
                    ? 'text-amber-600'
                    : item.tone === 'red'
                      ? 'text-red-600'
                      : item.tone === 'goal'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-foreground dark:text-foreground'
                }`}>{item.value}</strong>
                <span className="mt-1 block text-[9px] font-semibold text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {grounds.length > 0 && (
        <section className="rounded-3xl border border-emerald-900/10 bg-card p-5 dark:border-emerald-400/10 dark:bg-muted">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-foreground">
            <MapPin className="h-3.5 w-3.5 text-orange-500" />
            {t('grounds')}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {grounds.slice(0, 6).map((ground) => (
              <li key={ground.name} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="min-w-0 truncate font-semibold text-foreground dark:text-foreground">
                  {ground.name}
                  {ground.city ? <span className="font-medium text-muted-foreground"> · {ground.city}</span> : null}
                </span>
                <span className="shrink-0 tabular-nums text-orange-500">{ground.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {broadcasts.length > 0 && (
        <section className="rounded-3xl border border-emerald-900/10 bg-card p-5 dark:border-emerald-400/10 dark:bg-muted">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-foreground">
            <Radio className="h-3.5 w-3.5 text-orange-500" />
            {t('broadcasts')}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {broadcasts.slice(0, 6).map((channel) => {
              const active = activeChannel === channel.name;
              const row = (
                <>
                  {channel.logoUrl ? (
                    <img src={channel.logoUrl} alt="" className="h-5 w-5 object-contain" />
                  ) : (
                    <span className="h-5 w-5 rounded bg-emerald-950/5 dark:bg-card/[0.04]" />
                  )}
                  <span className={`min-w-0 flex-1 truncate font-semibold ${
                    active ? 'text-orange-600' : 'text-foreground dark:text-foreground'
                  }`}>{channel.name}</span>
                  <span className="tabular-nums text-orange-500">{channel.count}</span>
                </>
              );
              return (
                <li key={channel.name} className="text-[11px]">
                  {hrefForChannel ? (
                    <Link href={hrefForChannel(channel.name)} className="flex items-center gap-2 hover:text-orange-600">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
