'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { isAbortError } from '@/lib/ops/caught';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { versusHref, type VersusTeamOption } from './versus';
import styles from './compare.module.css';

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
    <div className={styles.well}>
      {selected ? (
        <div className={styles.picked}>
          {selected.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.logoUrl} alt="" />
          ) : (
            <span className={styles.mark}>{selected.name.charAt(0)}</span>
          )}
          <strong>{selected.name}</strong>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {t('clear')}
          </Button>
        </div>
      ) : (
        <>
          <Input
            label={slot}
            type="search"
            value={query}
            maxLength={80}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('type_name')}
            aria-label={label}
            aria-controls={listId}
            aria-expanded={open}
          />
          {open ? (
            <ul id={listId} className={styles.hits}>
              {hits.length > 0 ? (
                hits.map((team) => (
                  <li key={team.slug}>
                    <button
                      type="button"
                      className={styles.hit}
                      onClick={() => {
                        onPick(team);
                        setQuery('');
                        setOpen(false);
                      }}
                    >
                      {team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logoUrl} alt="" />
                      ) : (
                        <span className={styles.hitMark}>{team.name.charAt(0)}</span>
                      )}
                      {team.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.emptyHit}>{t('no_team', { q: query.trim() })}</li>
              )}
            </ul>
          ) : query.trim().length < 2 ? (
            <p className={styles.note}>{t('type_hint')}</p>
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
    <div className={styles.pair}>
      <TeamWell
        locale={locale}
        label={t('seat_a')}
        slot={t('kaf_a')}
        selected={left}
        occupied={right?.slug}
        onPick={setLeft}
        onClear={() => setLeft(null)}
      />
      <p className={styles.pairMark} aria-hidden>
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
      <div className={styles.actions}>
        <Button
          type="button"
          variant="accent"
          disabled={!ready}
          onClick={() => {
            if (!left || !right) return;
            router.push(versusHref(left.slug, right.slug));
          }}
        >
          {t('open_scale')}
        </Button>
        {ready ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!left || !right) return;
              router.push(versusHref(right.slug, left.slug));
            }}
          >
            {t('swap')}
          </Button>
        ) : null}
        {left && right && left.slug === right.slug ? <p className={styles.warn}>{t('same')}</p> : null}
        {left && !right ? (
          <Link href={`/team/${left.slug}`} className={styles.fileLink}>
            {t('open_file')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
