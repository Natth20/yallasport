'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { isAbortError } from '@/lib/ops/caught';

type Hit = { name: string; slug: string; photoUrl: string | null; teamName?: string | null };

function PlayerSearchField({
  label,
  value,
  onPick,
  onClear,
  locale,
}: {
  label: string;
  value: Hit | null;
  onPick: (hit: Hit) => void;
  onClear: () => void;
  locale: string;
}) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const ar = locale === 'ar';

  useEffect(() => {
    setQuery(value?.name ?? '');
  }, [value?.name]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || q === (value?.name ?? '')) {
      setHits([]);
      setLoading(false);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setOpen(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?kind=player&locale=${locale}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          if (!controller.signal.aborted) {
            setHits([]);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as {
          suggestions?: Array<{
            label: string;
            slug?: string;
            url: string;
            photoUrl?: string | null;
            teamName?: string | null;
          }>;
        };
        if (controller.signal.aborted) return;
        const next: Hit[] = (data.suggestions || []).flatMap((row) => {
          const slug = row.slug || row.url.split('/player/')[1] || '';
          if (!slug) return [];
          return [
            {
              name: row.label,
              slug,
              photoUrl: row.photoUrl ?? null,
              teamName: row.teamName ?? null,
            },
          ];
        });
        setHits(next);
        setActive(0);
        setLoading(false);
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;
        setHits([]);
        setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, value?.name]);

  const pickHit = (hit: Hit) => {
    onPick(hit);
    setQuery(hit.name);
    setHits([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <label className="mb-2 block text-xs font-bold">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (value && next.trim() !== value.name) onClear();
          }}
          onFocus={() => {
            if (hits.length || loading) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (!open) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (event.key === 'Enter' && hits[active]) {
              event.preventDefault();
              pickHit(hits[active]);
            }
            if (event.key === 'Escape') setOpen(false);
          }}
          placeholder={ar ? 'أي لاعب من المصدر…' : 'Any player from the source…'}
          className="h-12 flex-1 bg-transparent text-sm outline-none"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={open && hits[active] ? `${listId}-${hits[active].slug}` : undefined}
        />
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-border bg-card shadow-xl"
        >
          {loading ? (
            <li className="px-3 py-3 text-xs font-bold text-muted-foreground">{ar ? 'نبحث في المصدر…' : 'Searching the source…'}</li>
          ) : hits.length === 0 ? (
            <li className="px-3 py-3 text-xs font-bold text-muted-foreground">
              {ar ? 'ما في نتيجة من المصدر بهالاسم.' : 'The source returned no player for that name.'}
            </li>
          ) : (
            hits.map((hit, index) => (
              <li key={hit.slug} role="option" id={`${listId}-${hit.slug}`} aria-selected={index === active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm font-bold hover:bg-muted ${index === active ? 'bg-muted' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pickHit(hit)}
                >
                  {hit.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hit.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs">{hit.name.charAt(0)}</span>
                  )}
                  <span className="min-w-0">
                    <strong className="block truncate">{hit.name}</strong>
                    {hit.teamName ? (
                      <em className="block truncate text-[11px] font-semibold not-italic text-muted-foreground">{hit.teamName}</em>
                    ) : null}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function PlayerComparePicker({
  locale,
  initialP1,
  initialP2,
  faces,
}: {
  locale: string;
  initialP1?: Hit | null;
  initialP2?: Hit | null;
  faces?: Hit[];
}) {
  const router = useRouter();
  const [p1, setP1] = useState<Hit | null>(initialP1 ?? null);
  const [p2, setP2] = useState<Hit | null>(initialP2 ?? null);
  const ar = locale === 'ar';

  const compare = (left = p1, right = p2) => {
    if (!left || !right || left.slug === right.slug) return;
    router.push(`/compare-players?p1=${encodeURIComponent(left.slug)}&p2=${encodeURIComponent(right.slug)}`);
  };

  const swap = () => {
    if (!p1 && !p2) return;
    setP1(p2);
    setP2(p1);
    if (p1 && p2) {
      router.push(`/compare-players?p1=${encodeURIComponent(p2.slug)}&p2=${encodeURIComponent(p1.slug)}`);
    }
  };

  const pickFaceHref = (hit: Hit) => {
    if (p1 && p1.slug !== hit.slug) {
      return `/compare-players?p1=${encodeURIComponent(p1.slug)}&p2=${encodeURIComponent(hit.slug)}`;
    }
    if (p2 && p2.slug !== hit.slug) {
      return `/compare-players?p1=${encodeURIComponent(hit.slug)}&p2=${encodeURIComponent(p2.slug)}`;
    }
    return `/compare-players?p1=${encodeURIComponent(hit.slug)}`;
  };

  return (
    <div className="mx-auto mb-10 max-w-3xl space-y-4 rounded-3xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <PlayerSearchField locale={locale} label={ar ? 'اللاعب الأول' : 'First player'} value={p1} onPick={setP1} onClear={() => setP1(null)} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={swap}
            disabled={!p1 && !p2}
            className="h-12 rounded-2xl border border-border px-4 text-sm font-black disabled:opacity-40"
          >
            {ar ? 'تبديل' : 'Swap'}
          </button>
          <button
            type="button"
            onClick={() => compare()}
            disabled={!p1 || !p2 || p1.slug === p2.slug}
            className="h-12 rounded-2xl bg-orange-500 px-5 text-sm font-black text-primary-foreground disabled:opacity-40"
          >
            {ar ? 'قارن' : 'Compare'}
          </button>
        </div>
        <PlayerSearchField locale={locale} label={ar ? 'اللاعب الثاني' : 'Second player'} value={p2} onPick={setP2} onClear={() => setP2(null)} />
      </div>
      {faces && faces.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {ar ? 'وجوه معروفة' : 'Known names'}
          </p>
          <div className="flex flex-wrap gap-2">
            {faces.map((face) => (
              <Link
                key={face.slug}
                href={pickFaceHref(face)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold hover:border-primary"
              >
                {face.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
