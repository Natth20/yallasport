'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { isAbortError } from '@/lib/ops/caught';
import { seekHref } from '@/components/search/seek';
import styles from './header-seek.module.css';

type Hit = {
  label: string;
  typeKey?: string;
  url: string;
  photoUrl?: string | null;
};

function typeLabel(key: string | undefined, ar: boolean) {
  if (key === 'player') return ar ? 'لاعب' : 'Player';
  if (key === 'team') return ar ? 'فريق' : 'Team';
  if (key === 'league') return ar ? 'بطولة' : 'League';
  if (key === 'news') return ar ? 'خبر' : 'News';
  return ar ? 'نتيجة' : 'Hit';
}

export function HeaderSeek({
  open,
  onClose,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  locale: string;
}) {
  const router = useRouter();
  const ar = locale === 'ar';
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?locale=${locale}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          if (!controller.signal.aborted) {
            setHits([]);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as { suggestions?: Hit[] };
        if (controller.signal.aborted) return;
        setHits((data.suggestions || []).filter((row) => row.url));
        setActive(0);
        setLoading(false);
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;
        setHits([]);
        setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locale, open, query]);

  if (!open || typeof document === 'undefined') return null;

  const goAll = () => {
    const q = query.trim();
    if (!q) return;
    onClose();
    router.push(seekHref(q));
  };

  const panel = (
    <div className={styles.seek} role="dialog" aria-modal="true" aria-label={ar ? 'بحث يلا سبورت' : 'Yalla Sport search'}>
      <button type="button" className={styles.veil} onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'} />
      <div className={styles.panel}>
        <form
          className={styles.row}
          onSubmit={(event) => {
            event.preventDefault();
            if (hits[active]) {
              onClose();
              router.push(hits[active].url);
              return;
            }
            goAll();
          }}
        >
          <Search className={styles.icon} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
            }}
            placeholder={ar ? 'لاعب، فريق، بطولة، أو خبر…' : 'Player, team, league, or story…'}
            autoComplete="off"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={listId}
          />
          {query ? (
            <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label={ar ? 'مسح' : 'Clear'}>
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <kbd>esc</kbd>
        </form>

        <div className={styles.body}>
          {loading ? <p className={styles.meta}>{ar ? 'نبحث في المصدر…' : 'Searching the source…'}</p> : null}
          {!loading && query.trim().length >= 2 && hits.length === 0 ? (
            <p className={styles.meta}>{ar ? 'المصدر ما رجّع نتيجة بهالاسم.' : 'The source returned no match for that name.'}</p>
          ) : null}
          {hits.length > 0 ? (
            <ul id={listId} role="listbox" className={styles.list}>
              {hits.map((hit, index) => (
                <li key={`${hit.typeKey}-${hit.url}`} role="option" aria-selected={index === active}>
                  <Link
                    href={hit.url}
                    className={index === active ? styles.on : styles.hit}
                    onMouseEnter={() => setActive(index)}
                    onClick={onClose}
                  >
                    {hit.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hit.photoUrl} alt="" />
                    ) : (
                      <span>{hit.label.charAt(0)}</span>
                    )}
                    <em>
                      <strong>{hit.label}</strong>
                      <i>{typeLabel(hit.typeKey, ar)}</i>
                    </em>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {query.trim().length >= 2 ? (
            <button type="button" className={styles.all} onClick={goAll}>
              {ar ? `كل النتائج لـ «${query.trim()}»` : `All results for “${query.trim()}”`}
            </button>
          ) : (
            <p className={styles.hint}>{ar ? 'اكتب حرفين على الأقل. النتائج من المصدر فقط.' : 'Type at least two letters. Results come from the source only.'}</p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
