'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { isAbortError } from '@/lib/ops/caught';
import { versusHref, type VersusTeamOption } from './versus';

function TeamWell({
  locale,
  label,
  slot,
  selected,
  occupied,
  onPick,
  onClear,
}: {
  locale: string;
  label: string;
  slot: string;
  selected: VersusTeamOption | null;
  occupied?: string;
  onPick: (team: VersusTeamOption) => void;
  onClear: () => void;
}) {
  const t = useTranslations('versus');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<VersusTeamOption[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || selected) {
      setHits([]);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?kind=team&locale=${locale}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          suggestions?: Array<{ label: string; slug?: string; photoUrl?: string | null }>;
        };
        const next = (data.suggestions || [])
          .map((row) => ({
            id: row.slug || '',
            slug: row.slug || '',
            name: row.label,
            logoUrl: row.photoUrl ?? null,
          }))
          .filter((row) => row.slug && row.slug !== occupied);
        setHits(next);
        setOpen(true);
      } catch (error) {
        if (isAbortError(error)) return;
        setHits([]);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, occupied, selected]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{slot}</p>
      {selected ? (
        <div className="flex items-center gap-3">
          {selected.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.logoUrl} alt="" className="h-10 w-10 object-contain" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted">{selected.name.charAt(0)}</span>
          )}
          <strong className="min-w-0 flex-1 truncate">{selected.name}</strong>
          <button type="button" className="text-xs font-bold text-primary" onClick={onClear}>
            {t('clear')}
          </button>
        </div>
      ) : (
        <>
          <label className="block text-xs font-bold">
            <span className="sr-only">{label}</span>
            <input
              type="search"
              value={query}
              maxLength={80}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('type_name')}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
              aria-controls={listId}
              aria-expanded={open}
            />
          </label>
          {open ? (
            <ul id={listId} className="mt-2 max-h-52 overflow-auto rounded-xl border border-border">
              {hits.length > 0 ? (
                hits.map((team) => (
                  <li key={team.slug}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
                      onClick={() => {
                        onPick(team);
                        setQuery('');
                        setOpen(false);
                      }}
                    >
                      {team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logoUrl} alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <span className="grid h-6 w-6 place-items-center rounded bg-muted text-[10px]">{team.name.charAt(0)}</span>
                      )}
                      {team.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-xs text-muted-foreground">{t('no_team', { q: query.trim() })}</li>
              )}
            </ul>
          ) : query.trim().length < 2 ? (
            <p className="mt-2 text-xs text-muted-foreground">{t('type_hint')}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function VersusPair({
  locale,
  initialA,
  initialB,
}: {
  locale: string;
  initialA?: VersusTeamOption | null;
  initialB?: VersusTeamOption | null;
}) {
  const t = useTranslations('versus');
  const router = useRouter();
  const [left, setLeft] = useState<VersusTeamOption | null>(initialA ?? null);
  const [right, setRight] = useState<VersusTeamOption | null>(initialB ?? null);
  const ready = Boolean(left && right && left.slug !== right.slug);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <TeamWell
        locale={locale}
        label={t('seat_a')}
        slot={t('kaf_a')}
        selected={left}
        occupied={right?.slug}
        onPick={setLeft}
        onClear={() => setLeft(null)}
      />
      <p className="text-center text-2xl font-black text-muted-foreground" aria-hidden>
        ×
      </p>
      <TeamWell
        locale={locale}
        label={t('seat_b')}
        slot={t('kaf_b')}
        selected={right}
        occupied={left?.slug}
        onPick={setRight}
        onClear={() => setRight(null)}
      />
      <div className="md:col-span-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-40"
          disabled={!ready}
          onClick={() => {
            if (!left || !right) return;
            router.push(versusHref(left.slug, right.slug));
          }}
        >
          {t('open_scale')}
        </button>
        {left && right && left.slug === right.slug ? <p className="text-xs text-amber-500">{t('same')}</p> : null}
        {left && !right ? (
          <Link href={`/team/${left.slug}`} className="text-xs font-bold text-primary">
            {t('open_file')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
