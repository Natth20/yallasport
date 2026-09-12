import { Link } from '@/i18n/navigation';
import { MatchCountdown } from '@/components/sports/MatchCountdown';
import { ClientTime } from '@/components/datetime/ClientTime';
import { getLocale, getTranslations } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Bell, Radio, Timer, Users } from 'lucide-react';

export type DeskMatch = {
  id: string;
  kickoffAt: Date | string;
  status: string;
  minute?: number | null;
  homeTeam: { name: string; logoUrl?: string | null };
  awayTeam: { name: string; logoUrl?: string | null };
  league: { name: string };
  channel?: string;
  hasLicensedStream?: boolean;
};

export async function MatchdayDesk({
  soon,
  reminders,
  clashes,
  onAir,
}: {
  soon: DeskMatch[];
  reminders: DeskMatch[];
  clashes: Array<{ a: DeskMatch; b: DeskMatch }>;
  onAir: DeskMatch[];
}) {
  const locale = await getLocale();
  const t = await getTranslations('sports');
  if (soon.length === 0 && reminders.length === 0 && clashes.length === 0 && onAir.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {onAir.length > 0 ? (
        <section className="overflow-hidden rounded-[1.45rem] border border-orange-400/30 matchday-desk-onair">
          <header className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-orange-500 dark:text-orange-300" />
              <h2 className="text-sm font-bold text-foreground dark:text-foreground">{t('licensed_feed')}</h2>
            </div>
            <span className="text-[10px] font-black tabular-nums text-orange-600 dark:text-orange-200">
              {onAir.length}
            </span>
          </header>
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
            {onAir.map((match) => (
              <DeskCard key={match.id} match={match} live />
            ))}
          </div>
        </section>
      ) : null}

      {soon.length > 0 ? (
        <section className="matchday-soon overflow-hidden rounded-[1.45rem] border">
          <header className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-orange-500" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                  {t('kicking_off_soon')}
                </span>
                <h2 className="text-sm font-bold text-foreground dark:text-foreground">
                  {pick(locale, 'تنطلق خلال ساعتين', 'Kicking off within two hours')}
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-black tabular-nums text-orange-500">{soon.length}</span>
          </header>
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
            {soon.map((match) => (
              <DeskCard key={match.id} match={match} countdown />
            ))}
          </div>
        </section>
      ) : null}

      {reminders.length > 0 ? (
        <section className="matchday-plate !p-0 overflow-hidden">
          <header className="flex items-center gap-2 px-4 py-3">
            <Bell className="h-3.5 w-3.5 text-orange-500" />
            <h2 className="text-sm font-bold text-foreground dark:text-foreground">
              {pick(locale, 'تنبيهاتك لهذا اليوم', 'Your reminders today')}
            </h2>
          </header>
          <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
            {reminders.map((match) => (
              <DeskCard key={match.id} match={match} countdown={match.status === 'NOT_STARTED'} />
            ))}
          </div>
        </section>
      ) : null}

      {clashes.length > 0 ? (
        <section className="rounded-2xl border border-amber-400/35 bg-amber-50/80 px-4 py-4 dark:border-amber-400/20 dark:bg-amber-500/10">
          <header className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            <h2 className="text-sm font-bold text-foreground dark:text-foreground">
              {pick(locale, 'تعارض في فرقك', 'A clash in your teams')}
            </h2>
          </header>
          <ul className="space-y-2">
            {clashes.slice(0, 3).map(({ a, b }) => (
              <li
                key={`${a.id}-${b.id}`}
                className="rounded-xl border border-amber-400/20 bg-card/80 px-3 py-2.5 text-[11px] dark:bg-muted"
              >
                <p className="font-semibold text-foreground dark:text-foreground">
                  {pick(
                    locale,
                    'ركلتان في نفس الدقيقة تقريباً — اختر أي ملعب تتابع.',
                    'Two kickoffs almost overlap — pick which pitch to follow.'
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`/match/${a.id}`} className="font-bold text-orange-600 hover:underline">
                    {a.homeTeam.name} × {a.awayTeam.name}
                    {' · '}
                    <ClientTime value={a.kickoffAt} />
                  </Link>
                  <Link href={`/match/${b.id}`} className="font-bold text-orange-600 hover:underline">
                    {b.homeTeam.name} × {b.awayTeam.name}
                    {' · '}
                    <ClientTime value={b.kickoffAt} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DeskCard({
  match,
  countdown,
  live,
}: {
  match: DeskMatch;
  countdown?: boolean;
  live?: boolean;
}) {
  return (
    <Link
      href={`/match/${match.id}`}
      className={`min-w-[220px] flex-1 rounded-xl border px-3 py-3 transition-transform hover:-translate-y-0.5 ${
        live
          ? 'border-orange-400/35 bg-orange-50/80 dark:border-orange-300/25 dark:bg-card/[0.04]'
          : 'border-border bg-card dark:border-border dark:bg-muted'
      }`}
    >
      <div className={`mb-2 flex items-center justify-between gap-2 text-[9px] font-semibold ${
        live ? 'text-muted-foreground dark:text-foreground/60' : 'text-muted-foreground'
      }`}>
        <span className="truncate">{match.league.name}</span>
        {match.channel ? <span className="shrink-0 truncate text-orange-500">{match.channel}</span> : null}
      </div>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match.homeTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-6 w-6 object-contain" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-foreground dark:text-foreground">
          {match.homeTeam.name}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match.awayTeam.logoUrl || '/placeholder-team.png'} alt="" className="h-6 w-6 object-contain" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-foreground dark:text-foreground">
          {match.awayTeam.name}
        </span>
      </div>
      <div className={`mt-2 text-[10px] font-black tabular-nums ${live ? 'text-orange-600 dark:text-orange-200' : 'text-orange-500'}`}>
        {live ? (
          match.minute ? `${match.minute}′` : 'LIVE'
        ) : countdown ? (
          <MatchCountdown kickoffAt={new Date(match.kickoffAt)} compact />
        ) : (
          <ClientTime value={match.kickoffAt} />
        )}
      </div>
    </Link>
  );
}
