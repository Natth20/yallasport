'use client';

import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { versusHref, type VersusTeamOption } from './versus';

function Well({
  label,
  slot,
  query,
  onQuery,
  selected,
  onClear,
  hits,
  onPick,
}: {
  label: string;
  slot: string;
  query: string;
  onQuery: (value: string) => void;
  selected: VersusTeamOption | null;
  onClear: () => void;
  hits: VersusTeamOption[];
  onPick: (team: VersusTeamOption) => void;
}) {
  const t = useTranslations('versus');
  return (
    <div className="versus-well">
      <p className="versus-well-slot">{slot}</p>
      {selected ? (
        <div className="versus-seated">
          {selected.logoUrl ? (
            <img src={selected.logoUrl} alt="" />
          ) : (
            <span>{selected.name.charAt(0)}</span>
          )}
          <strong>{selected.name}</strong>
          <button type="button" onClick={onClear}>
            {t('clear')}
          </button>
        </div>
      ) : (
        <>
          <label>
            <span>{label}</span>
            <input
              type="search"
              value={query}
              maxLength={80}
              autoComplete="off"
              onChange={(event) => onQuery(event.target.value)}
              placeholder={t('type_name')}
            />
          </label>
          {query.trim().length >= 2 ? (
            hits.length > 0 ? (
              <ul>
                {hits.map((team) => (
                  <li key={team.slug}>
                    <button type="button" onClick={() => onPick(team)}>
                      {team.logoUrl ? <img src={team.logoUrl} alt="" /> : <span>{team.name.charAt(0)}</span>}
                      {team.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="versus-miss">{t('no_team', { q: query.trim() })}</p>
            )
          ) : (
            <p className="versus-miss">{t('type_hint')}</p>
          )}
        </>
      )}
    </div>
  );
}

export function VersusPair({
  teams,
  initialA,
  initialB,
}: {
  teams: VersusTeamOption[];
  initialA?: string;
  initialB?: string;
}) {
  const t = useTranslations('versus');
  const router = useRouter();
  const bySlug = useMemo(() => new Map(teams.map((team) => [team.slug, team])), [teams]);
  const [a, setA] = useState<string | undefined>(initialA);
  const [b, setB] = useState<string | undefined>(initialB);
  const [qA, setQA] = useState('');
  const [qB, setQB] = useState('');

  const filter = (q: string, occupied?: string) => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return teams
      .filter((team) => team.slug !== occupied && team.name.toLowerCase().includes(needle))
      .slice(0, 8);
  };

  const left = a ? bySlug.get(a) || null : null;
  const right = b ? bySlug.get(b) || null : null;
  const ready = Boolean(left && right && left.slug !== right.slug);

  const open = () => {
    if (!left || !right || left.slug === right.slug) return;
    router.push(versusHref(left.slug, right.slug));
  };

  return (
    <div className="versus-pair">
      <Well
        label={t('seat_a')}
        slot={t('kaf_a')}
        query={qA}
        onQuery={setQA}
        selected={left}
        onClear={() => {
          setA(undefined);
          setQA('');
        }}
        hits={filter(qA, b)}
        onPick={(team) => {
          setA(team.slug);
          setQA('');
        }}
      />
      <p className="versus-times" aria-hidden="true">
        ×
      </p>
      <Well
        label={t('seat_b')}
        slot={t('kaf_b')}
        query={qB}
        onQuery={setQB}
        selected={right}
        onClear={() => {
          setB(undefined);
          setQB('');
        }}
        hits={filter(qB, a)}
        onPick={(team) => {
          setB(team.slug);
          setQB('');
        }}
      />
      <div className="versus-pair-go">
        <button type="button" className="versus-cta" disabled={!ready} onClick={open}>
          {t('open_scale')}
        </button>
        {left && right && left.slug === right.slug ? <p>{t('same')}</p> : null}
        {left && !right ? (
          <Link href={`/team/${left.slug}`} className="versus-ghost-link">
            {t('open_file')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
