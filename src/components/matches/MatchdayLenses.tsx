import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';

export type LensChip = {
  value: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
  logoUrl?: string | null;
};

export async function MatchdayLenses({
  leagues,
  channels,
  hours,
  clearHref,
}: {
  leagues: LensChip[];
  channels: LensChip[];
  hours: LensChip[];
  clearHref: string;
}) {
  const locale = await getLocale();
  const hasActive = leagues.some((chip) => chip.active)
    || channels.some((chip) => chip.active)
    || hours.some((chip) => chip.active);

  if (leagues.length < 2 && channels.length === 0 && hours.length < 2 && !hasActive) {
    return null;
  }

  return (
    <div className="space-y-2">
      {hasActive ? (
        <div className="flex justify-end">
          <Link
            href={clearHref}
            className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:border-orange-500/40 hover:text-orange-600 dark:border-border dark:bg-muted"
          >
            {pick(locale, 'عرض كل المباريات', 'Show all matches')}
          </Link>
        </div>
      ) : null}
      {leagues.length > 0 ? <LensRail chips={leagues} /> : null}
      {channels.length > 0 ? <LensRail chips={channels} /> : null}
      {hours.length > 0 ? <LensRail chips={hours} tabular /> : null}
    </div>
  );
}

function LensRail({
  chips,
  tabular,
}: {
  chips: LensChip[];
  tabular?: boolean;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {chips.map((chip) => (
        <Link
          key={chip.value}
          href={chip.href}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
            chip.active
              ? 'border-orange-500/50 bg-orange-500 text-primary-foreground'
              : 'border-border bg-card text-foreground hover:border-orange-500/30 hover:text-orange-600 dark:border-border dark:bg-muted dark:text-muted-foreground'
          }`}
        >
          {chip.logoUrl ? (
            <img src={chip.logoUrl} alt="" className="h-3.5 w-3.5 object-contain" />
          ) : null}
          <span className={tabular ? 'tabular-nums' : undefined}>{chip.label}</span>
          <span className={`tabular-nums ${chip.active ? 'text-white/80' : 'text-muted-foreground'}`}>
            {chip.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
