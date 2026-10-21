import { Link } from '@/i18n/navigation';
import { MatchCountdown } from '@/components/sports/MatchCountdown';
import { ClientTime } from '@/components/datetime/ClientTime';
import { getLocale, getTranslations } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Bell, Radio, Timer, Users } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';

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
        <section className="overflow-hidden rounded-[1.45rem] border border-orange-400/30 bg-card/60 dark:bg-muted/40">
          <header className="flex items-center justify-between gap-3 border-b border-orange-400/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground">{t('licensed_feed')}</h2>
            </div>
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black tabular-nums text-orange-600 dark:text-orange-300">
              {onAir.length}
            </span>
          </header>
          <div className="flex gap-3 overflow-x-auto px-4 py-3.5 no-scrollbar snap-x snap-mandatory">
            {onAir.map((match) => (
              <DeskCard key={match.id} match={match} live />
            ))}
          </div>
        </section>
      ) : null}

      {soon.length > 0 ? (
        <section className="overflow-hidden rounded-[1.45rem] border border-border/80 bg-card/60 dark:bg-muted/40">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">
                  {t('kicking_off_soon')}
                </span>
                <h2 className="text-sm font-bold text-foreground">
                  {pick(locale, 'تنطلق خلال ساعتين', 'Kicking off within two hours')}
                </h2>
              </div>
            </div>
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black tabular-nums text-orange-500">
              {soon.length}
            </span>
          </header>
          <div className="flex gap-3 overflow-x-auto px-4 py-3.5 no-scrollbar snap-x snap-mandatory">
            {soon.map((match) => (
              <DeskCard key={match.id} match={match} countdown />
            ))}
          </div>
        </section>
      ) : null}

      {reminders.length > 0 ? (
        <section className="overflow-hidden rounded-[1.45rem] border border-border/80 bg-card/60 dark:bg-muted/40">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold text-foreground">
                {pick(locale, 'تنبيهاتك لهذا اليوم', 'Your reminders today')}
              </h2>
            </div>
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black tabular-nums text-orange-500">
              {reminders.length}
            </span>
          </header>
          <div className="flex gap-3 overflow-x-auto px-4 py-3.5 no-scrollbar snap-x snap-mandatory">
            {reminders.map((match) => (
              <DeskCard key={match.id} match={match} countdown={match.status === 'NOT_STARTED'} />
            ))}
          </div>
        </section>
      ) : null}

      {clashes.length > 0 ? (
        <section className="rounded-2xl border border-amber-400/35 bg-amber-50/80 px-4 py-4 dark:border-amber-400/20 dark:bg-amber-500/10">
          <header className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-foreground">
              {pick(locale, 'تعارض في فرقك', 'A clash in your teams')}
            </h2>
          </header>
          <ul className="space-y-2">
            {clashes.slice(0, 3).map(({ a, b }) => (
              <li
                key={`${a.id}-${b.id}`}
                className="rounded-xl border border-amber-400/20 bg-card/80 px-3 py-2.5 text-[11px] dark:bg-muted"
              >
                <p className="font-semibold text-foreground">
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
      className={`shrink-0 w-[240px] sm:w-[260px] snap-start rounded-2xl border p-3.5 transition-all hover:scale-[1.01] ${
        live
          ? 'border-orange-500/40 bg-orange-50/90 dark:border-orange-500/35 dark:bg-orange-500/10'
          : 'border-border/80 bg-card dark:border-border/60 dark:bg-muted/80 shadow-sm'
      }`}
    >
      <div className={`mb-2.5 flex items-center justify-between gap-2 text-[10px] font-bold ${
        live ? 'text-orange-600 dark:text-orange-300' : 'text-muted-foreground'
      }`}>
        <span className="truncate">{match.league.name}</span>
        {match.channel ? <span className="shrink-0 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-500">{match.channel}</span> : null}
      </div>
      <div className="flex items-center gap-2.5">
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-6 w-6 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-foreground">
          <bdi dir="auto">{match.homeTeam.name}</bdi>
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2.5">
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-6 w-6 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-foreground">
          <bdi dir="auto">{match.awayTeam.name}</bdi>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] font-black tabular-nums">
        <span className="text-[10px] font-bold text-muted-foreground">
          {live ? 'مباشر' : countdown ? 'انطلاق بعد' : 'الموعد'}
        </span>
        <span className={live ? 'text-red-500 font-bold' : 'text-orange-500 font-bold'}>
          {live ? (
            match.minute ? `${match.minute}′` : 'LIVE'
          ) : countdown ? (
            <MatchCountdown kickoffAt={new Date(match.kickoffAt)} variant="pill" />
          ) : (
            <ClientTime value={match.kickoffAt} />
          )}
        </span>
      </div>
    </Link>
  );
}
