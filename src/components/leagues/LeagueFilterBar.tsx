'use client';

import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

interface LeagueFilterBarProps {
  activeFilter: string;
  activeSort: string;
  counts: {
    all: number;
    following: number;
    live: number;
    standings: number;
    covered: number;
  };
  baseParams: {
    q?: string;
    country?: string;
  };
}

const filters = [
  { value: 'all', label: 'all' },
  { value: 'following', label: 'followed' },
  { value: 'live', label: 'live' },
  { value: 'standings', label: 'tables' },
  { value: 'covered', label: 'recorded' },
] as const;

const sorts = [
  { value: 'coverage', label: 'coverage' },
  { value: 'name', label: 'name' },
  { value: 'upcoming', label: 'next_match' },
] as const;

function buildHref(
  baseParams: LeagueFilterBarProps['baseParams'],
  filter: string,
  sort: string
) {
  const params = new URLSearchParams();
  if (baseParams.q) params.set('q', baseParams.q);
  if (baseParams.country && baseParams.country !== 'all') params.set('country', baseParams.country);
  if (filter !== 'all') params.set('filter', filter);
  if (sort !== 'coverage') params.set('sort', sort);
  const search = params.toString();
  return search ? `/leagues?${search}` : '/leagues';
}

export function LeagueFilterBar({
  activeFilter,
  activeSort,
  counts,
  baseParams,
}: LeagueFilterBarProps) {
  const t = useTranslations('sports');
  const visibleFilters = filters.filter((filter) => {
    if (filter.value === 'all') return true;
    if (filter.value === activeFilter) return true;
    if (filter.value === 'covered' && counts.covered === counts.all) return false;
    return counts[filter.value] > 0;
  });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 no-scrollbar dark:border-border dark:bg-card/[0.04]">
        {visibleFilters.map((filter) => {
          const active = activeFilter === filter.value;
          const live = filter.value === 'live' && counts.live > 0;
          return (
            <Link
              key={filter.value}
              href={buildHref(baseParams, filter.value, activeSort)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
                active
                  ? live
                    ? 'bg-rose-600 text-white'
                    : 'bg-background text-white dark:bg-card dark:text-foreground'
                  : live
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground'
              }`}
            >
              {live ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> : null}
              {t(filter.label)}
              <span className={`tabular-nums ${active ? 'text-white/70' : live ? 'text-rose-400' : 'text-muted-foreground'}`}>
                {counts[filter.value]}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3 px-1">
        {sorts.map((sort) => (
          <Link
            key={sort.value}
            href={buildHref(baseParams, activeFilter, sort.value)}
            className={`text-[11px] font-semibold ${
              activeSort === sort.value ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {t(sort.label)}
          </Link>
        ))}
      </div>
    </div>
  );
}
