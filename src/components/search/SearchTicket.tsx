'use client';
import { reportCaughtError } from '@/lib/ops/caught';

import { useDebounce } from '@/lib/hooks/use-debounce';
import { Link, useRouter } from '@/i18n/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { seekHref, type SeekKind } from './seek';
import { VoiceSearch } from '@/components/layout/VoiceSearch';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './search.module.css';

type Suggestion = {
  label: string;
  typeKey: 'team' | 'player' | 'league' | 'news' | 'coach' | 'video' | 'photo';
  url: string;
  photoUrl?: string | null;
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
      } catch (error) {
        reportCaughtError("src/components/search/SearchTicket.tsx:52", error, { persist: false });
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
    if (key === 'coach') return t('type_coach');
    if (key === 'video') return t('type_video');
    if (key === 'photo') return t('type_photo');
    return t('type_news');
  };

  return (
    <div className={styles.ticket} ref={box}>
      <form onSubmit={go} className={styles.ticketRow}>
        <div className={styles.grow}>
          <Input
            id="seek-q"
            name="q"
            type="search"
            inputSize="lg"
            label={t('ticket_label')}
            maxLength={80}
            value={query}
            autoComplete="off"
            leftIcon={<SearchIcon aria-hidden="true" />}
            isClearable
            onClear={() => setQuery('')}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t('placeholder')}
          />
        </div>
        <div className={styles.actions}>
          <VoiceSearch
            onResult={(text) => {
              setQuery(text);
              setOpen(true);
              router.push(seekHref(text, kind));
            }}
          />
          <Tooltip content={t('submit')} position="bottom">
            <button type="submit" className={styles.go}>
              {t('submit')}
            </button>
          </Tooltip>
        </div>
      </form>

      {open && isLoading ? (
        <div className={styles.suggest}>
          <Skeleton variant="text" count={2} />
        </div>
      ) : null}

      {open && !isLoading && (suggestions.length > 0 || query.trim().length >= 2) ? (
        <div className={styles.suggest} role="listbox">
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const prev = suggestions[index - 1];
              return (
                <div key={`${item.typeKey}-${item.url}`}>
                  {!prev || prev.typeKey !== item.typeKey ? (
                    <p className={styles.suggestEmpty}>{typeLabel(item.typeKey)}</p>
                  ) : null}
                  <Link href={item.url} className={styles.suggestRow} onClick={() => setOpen(false)}>
                    <span className={styles.suggestLabel}>{item.label}</span>
                    <Badge variant="accent" size="sm">{typeLabel(item.typeKey)}</Badge>
                  </Link>
                </div>
              );
            })
          ) : (
            <p className={styles.suggestEmpty}>{t('no_suggest', { q: query.trim() })}</p>
          )}
          {query.trim() ? (
            <button type="button" className={styles.suggestAll} onClick={() => go()}>
              {t('all_for', { q: query.trim() })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
