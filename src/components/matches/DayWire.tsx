import {Link} from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';

const labelKeys: Record<string, 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'substitution' | 'var'> = {
  GOAL: 'goal', OWN_GOAL: 'own_goal', PENALTY: 'penalty', YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card', SUBSTITUTION: 'substitution', VAR: 'var'
};

export type WireEvent = {
  id: string;
  matchId: string;
  type: string;
  minute: string;
  player: string;
  teamName: string;
  teamLogo?: string | null;
  leagueName: string;
  homeName: string;
  awayName: string;
};

export async function DayWire({ events }: { events: WireEvent[] }) {
  const t = await getTranslations('sports');
  if (events.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-card/90 dark:border-emerald-400/10 dark:bg-muted">
      <div className="flex items-end justify-between gap-3 border-b border-emerald-900/10 px-5 py-4 dark:border-border">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-orange-500">{t('wire')}</span>
          <h2 className="mt-1 text-sm font-bold text-foreground dark:text-foreground">{t('daily_events')}</h2>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">{t('live_events', {count: events.length})}</span>
      </div>
      <ol className="event-wire divide-y divide-emerald-900/10 dark:divide-white/5">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/match/${event.matchId}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-card dark:hover:bg-muted"
            >
              <span
                className={`w-14 shrink-0 text-[9px] font-bold ${
                  event.type === 'GOAL' || event.type === 'PENALTY'
                    ? 'text-emerald-600'
                    : event.type === 'RED_CARD'
                      ? 'text-red-500'
                      : event.type === 'YELLOW_CARD'
                        ? 'text-amber-500'
                        : 'text-orange-500'
                }`}
              >
                {labelKeys[event.type] ? t(labelKeys[event.type]) : event.type}
              </span>
              <img src={event.teamLogo || '/placeholder-team.png'} alt="" className="h-6 w-6 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-foreground dark:text-foreground">{event.player}</p>
                <p className="truncate text-[9px] font-medium text-muted-foreground">
                  {event.teamName} · {event.homeName} × {event.awayName} · {event.leagueName}
                </p>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-orange-500">{event.minute}&prime;</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
