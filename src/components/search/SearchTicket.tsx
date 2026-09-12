'use client';

import { useDebounce } from '@/lib/hooks/use-debounce';
import { Link, useRouter } from '@/i18n/navigation';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { seekHref, type SeekKind } from './seek';
import { VoiceSearch } from '@/components/layout/VoiceSearch';

type Suggestion = {
  label: string;
  typeKey: 'team' | 'player' | 'league' | 'news';
  url: string;
};

export function SearchTicket({
  initialQuery = '',
  kind = 'all',
}: {
  initialQuery?: string;
  kind?: SeekKind;
}) {
  const t = useTranslations('seek');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 300);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const run = async () => {
      const q = debounced.trim();
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [debounced, locale]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const go = (event?: FormEvent) => {
    event?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(seekHref(q, kind));
  };

  const typeLabel = (key: Suggestion['typeKey']) => {
    if (key === 'team') return t('type_team');
    if (key === 'player') return t('type_player');
    if (key === 'league') return t('type_league');
    return t('type_news');
  };

  return (
    <div className="search-ticket" ref={box}>
      <span className="search-ticket-perf" aria-hidden="true" />
      <form onSubmit={go} className="search-ticket-form">
        <label className="search-ticket-label" htmlFor="seek-q">
          {t('ticket_label')}
        </label>
        <div className="search-ticket-row">
          <SearchIcon className="search-ticket-icon" aria-hidden="true" />
          <input
            id="seek-q"
            name="q"
            type="search"
            maxLength={80}
            value={query}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t('placeholder')}
          />
          {isLoading ? <Loader2 className="search-ticket-spin" aria-hidden="true" /> : null}
          {query ? (
            <button type="button" className="search-ticket-clear" onClick={() => setQuery('')} aria-label={t('clear')}>
              <X />
            </button>
          ) : null}
          <VoiceSearch
            onResult={(text) => {
              setQuery(text);
              setOpen(true);
              router.push(seekHref(text, kind));
            }}
          />
          <button type="submit" className="search-ticket-go">
            {t('submit')}
          </button>
        </div>
      </form>

      {open && (suggestions.length > 0 || (query.trim().length >= 2 && !isLoading)) ? (
        <div className="search-suggest" role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <Link
                key={`${item.typeKey}-${item.url}`}
                href={item.url}
                className="search-suggest-row"
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                <em>{typeLabel(item.typeKey)}</em>
              </Link>
            ))
          ) : (
            <p className="search-suggest-empty">{t('no_suggest', { q: query.trim() })}</p>
          )}
          {query.trim() ? (
            <button type="button" className="search-suggest-all" onClick={() => go()}>
              {t('all_for', { q: query.trim() })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
