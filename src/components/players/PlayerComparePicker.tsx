'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { isAbortError } from '@/lib/ops/caught';
import folio from './compare-folio.module.css';

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
  const hitsRef = useRef<Hit[]>([]);
  const lastQ = useRef('');
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
    const prev = lastQ.current;
    if (prev && q.toLowerCase().startsWith(prev.toLowerCase()) && hitsRef.current.length > 0) {
      const local = hitsRef.current.filter(
        (hit) =>
          hit.name.toLowerCase().includes(q.toLowerCase()) || hit.slug.toLowerCase().includes(q.toLowerCase()),
      );
      if (local.length) setHits(local);
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setOpen(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/players/suggest?locale=${locale}&q=${encodeURIComponent(q)}`,
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
        hitsRef.current = next;
        lastQ.current = q;
        setHits(next);
        setActive(0);
        setLoading(false);
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;
        setHits([]);
        setLoading(false);
      }
    }, 120);
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
    <div className={folio.field} ref={wrapRef}>
      <label>{label}</label>
      <div className={folio.fieldBox} data-picked={value ? 'true' : 'false'} data-busy={loading ? 'true' : 'false'}>
        {value?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.photoUrl} alt="" className={folio.fieldFace} />
        ) : (
          <Search className={folio.fieldIcon} />
        )}
        <input
          spellCheck={false}
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
          placeholder={ar ? 'اكتب اسم اللاعب…' : 'Type a player name…'}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={open && hits[active] ? `${listId}-${hits[active].slug}` : undefined}
        />
      </div>
      {open ? (
        <ul id={listId} role="listbox" className={folio.suggest}>
          {loading && hits.length === 0 ? (
            <li className={folio.suggestEmpty}>{ar ? 'نبحث في الدفتر…' : 'Checking the desk…'}</li>
          ) : hits.length === 0 ? (
            <li className={folio.suggestEmpty}>
              {ar ? 'ما في لاعب بهالاسم من المصدر.' : 'The source returned no player for that name.'}
            </li>
          ) : (
            hits.map((hit, index) => (
              <li key={hit.slug} role="option" id={`${listId}-${hit.slug}`} aria-selected={index === active}>
                <button
                  type="button"
                  className={index === active ? folio.suggestOn : folio.suggestBtn}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pickHit(hit)}
                >
                  {hit.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hit.photoUrl} alt="" />
                  ) : (
                    <span>{hit.name.charAt(0)}</span>
                  )}
                  <em>
                    <strong>{hit.name}</strong>
                    {hit.teamName ? <i>{hit.teamName}</i> : null}
                  </em>
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
  season,
}: {
  locale: string;
  initialP1?: Hit | null;
  initialP2?: Hit | null;
  faces?: Hit[];
  season?: number;
}) {
  const router = useRouter();
  const [p1, setP1] = useState<Hit | null>(initialP1 ?? null);
  const [p2, setP2] = useState<Hit | null>(initialP2 ?? null);
  const ar = locale === 'ar';

  const hrefFor = (left: Hit, right: Hit) => {
    const seasonQ = season ? `&season=${season}` : '';
    return `/compare-players?p1=${encodeURIComponent(left.slug)}&p2=${encodeURIComponent(right.slug)}${seasonQ}`;
  };

  const compare = (left = p1, right = p2) => {
    if (!left || !right || left.slug === right.slug) return;
    if (left.slug === initialP1?.slug && right.slug === initialP2?.slug) return;
    router.push(hrefFor(left, right));
  };

  useEffect(() => {
    if (!p1 || !p2 || p1.slug === p2.slug) return;
    if (p1.slug === initialP1?.slug && p2.slug === initialP2?.slug) return;
    router.push(hrefFor(p1, p2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p1?.slug, p2?.slug]);

  const swap = () => {
    if (!p1 && !p2) return;
    setP1(p2);
    setP2(p1);
    if (p1 && p2) router.push(hrefFor(p2, p1));
  };

  const pickFaceHref = (hit: Hit) => {
    const seasonQ = season ? `&season=${season}` : '';
    if (p1 && p1.slug !== hit.slug) {
      return `/compare-players?p1=${encodeURIComponent(p1.slug)}&p2=${encodeURIComponent(hit.slug)}${seasonQ}`;
    }
    if (p2 && p2.slug !== hit.slug) {
      return `/compare-players?p1=${encodeURIComponent(hit.slug)}&p2=${encodeURIComponent(p2.slug)}${seasonQ}`;
    }
    return `/compare-players?p1=${encodeURIComponent(hit.slug)}${seasonQ}`;
  };

  return (
    <div className={folio.picker}>
      <div className={folio.pickerRow}>
        <PlayerSearchField locale={locale} label={ar ? 'الكفة الأولى' : 'Left scale'} value={p1} onPick={setP1} onClear={() => setP1(null)} />
        <div className={folio.pickerActions}>
          <span className={folio.vsMark} aria-hidden>
            VS
          </span>
          <button type="button" onClick={swap} disabled={!p1 && !p2} className={folio.swapBtn}>
            {ar ? 'تبديل' : 'Swap'}
          </button>
          <button
            type="button"
            onClick={() => compare()}
            disabled={!p1 || !p2 || p1.slug === p2.slug}
            className={folio.goBtn}
          >
            {ar ? 'قارن الآن' : 'Compare now'}
          </button>
        </div>
        <PlayerSearchField locale={locale} label={ar ? 'الكفة الثانية' : 'Right scale'} value={p2} onPick={setP2} onClear={() => setP2(null)} />
      </div>
      {faces && faces.length > 0 ? (
        <div className={folio.faces}>
          <p>{ar ? 'وجوه من الدفتر' : 'Names on file'}</p>
          <div>
            {faces.map((face) => (
              <Link key={face.slug} href={pickFaceHref(face)} className={folio.faceChip}>
                {face.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={face.photoUrl} alt="" />
                ) : (
                  <span>{face.name.charAt(0)}</span>
                )}
                {face.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
