'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { PlayerCompareCard } from '@/lib/players/load-dossier';
import folio from './compare-folio.module.css';

type Row = { key: string; label: string; left: number | null; right: number | null; better?: 'high' | 'low' };

function cell(value: number | null | undefined, empty = '—') {
  if (value == null || Number.isNaN(value)) return empty;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function Radar({ left, right, labels }: { left: number[]; right: number[]; labels: string[] }) {
  const n = labels.length;
  const cx = 120;
  const cy = 120;
  const r = 88;
  const point = (i: number, mag: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r * mag, cy + Math.sin(angle) * r * mag] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => point(i, Math.max(0.04, Math.min(1, v))).join(',')).join(' ');
  return (
    <svg viewBox="0 0 240 240" className={folio.radar} role="img">
      {[0.33, 0.66, 1].map((ring) => (
        <polygon
          key={ring}
          fill="none"
          className={folio.radarRing}
          points={Array.from({ length: n }, (_, i) => point(i, ring).join(',')).join(' ')}
        />
      ))}
      <polygon className={folio.radarInk} points={poly(left)} strokeWidth={1.5} />
      <polygon className={folio.radarMark} points={poly(right)} strokeWidth={1.5} />
      {labels.map((label, i) => {
        const [x, y] = point(i, 1.16);
        return (
          <text key={label} x={x} y={y} textAnchor="middle" className={folio.radarLabel} fontSize="9">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function PlayerCompareBoard({
  locale,
  left,
  right,
  gk,
  p1,
  p2,
  season,
}: {
  locale: string;
  left: PlayerCompareCard;
  right: PlayerCompareCard;
  gk: boolean;
  p1: string;
  p2: string;
  season?: number;
}) {
  const router = useRouter();
  const [per90, setPer90] = useState(false);
  const [copied, setCopied] = useState(false);
  const ar = locale === 'ar';

  const rows: Row[] = useMemo(() => {
    const take = (card: PlayerCompareCard, key: keyof NonNullable<PlayerCompareCard['totals']>) => {
      if (!card.totals) return null;
      const value = card.totals[key];
      return typeof value === 'number' ? value : value ? Number(value) : null;
    };
    const per = (card: PlayerCompareCard, key: 'goals' | 'assists' | 'shotsOn' | 'keyPasses' | 'tackles' | 'saves') => {
      if (!per90) return take(card, key);
      const minutes = take(card, 'minutes') || 0;
      const raw = take(card, key);
      if (raw == null || minutes <= 0) return null;
      return Number(((raw * 90) / minutes).toFixed(2));
    };
    const list: Row[] = [
      { key: 'apps', label: ar ? 'المشاركات' : 'Appearances', left: take(left, 'appearances'), right: take(right, 'appearances') },
      { key: 'mins', label: ar ? 'الدقائق' : 'Minutes', left: take(left, 'minutes'), right: take(right, 'minutes') },
      { key: 'rating', label: ar ? 'التقييم' : 'Rating', left: take(left, 'rating' as never) ?? (left.totals?.rating ? Number(left.totals.rating) : null), right: right.totals?.rating ? Number(right.totals.rating) : null },
      { key: 'goals', label: per90 ? (ar ? 'هدف / 90' : 'Goals / 90') : ar ? 'الأهداف' : 'Goals', left: per(left, 'goals'), right: per(right, 'goals') },
      { key: 'assists', label: per90 ? (ar ? 'صناعة / 90' : 'Assists / 90') : ar ? 'الصناعات' : 'Assists', left: per(left, 'assists'), right: per(right, 'assists') },
      { key: 'pass', label: ar ? 'دقة التمرير %' : 'Pass accuracy %', left: left.totals?.passAccuracy ?? null, right: right.totals?.passAccuracy ?? null },
      { key: 'duel', label: ar ? 'الفوز بالالتحام %' : 'Duel win %', left: left.rates?.duelWinPct ?? null, right: right.rates?.duelWinPct ?? null },
      { key: 'drib', label: ar ? 'نجاح المراوغة %' : 'Dribble success %', left: left.rates?.dribbleSuccessPct ?? null, right: right.rates?.dribbleSuccessPct ?? null },
      { key: 'shotsOn', label: ar ? 'تسديدات على المرمى' : 'Shots on target', left: per(left, 'shotsOn'), right: per(right, 'shotsOn') },
      { key: 'key', label: ar ? 'تمريرات حاسمة' : 'Key passes', left: per(left, 'keyPasses'), right: per(right, 'keyPasses') },
      { key: 'tackles', label: ar ? 'التدخلات' : 'Tackles', left: per(left, 'tackles'), right: per(right, 'tackles') },
      { key: 'yellow', label: ar ? 'صفراء' : 'Yellow', left: take(left, 'yellow'), right: take(right, 'yellow'), better: 'low' },
      { key: 'red', label: ar ? 'حمراء' : 'Red', left: take(left, 'red'), right: take(right, 'red'), better: 'low' },
    ];
    if (gk) {
      list.splice(5, 0, {
        key: 'saves',
        label: ar ? 'التصديات' : 'Saves',
        left: per(left, 'saves'),
        right: per(right, 'saves'),
      }, {
        key: 'conc',
        label: ar ? 'أهداف استقبلها' : 'Conceded',
        left: take(left, 'conceded'),
        right: take(right, 'conceded'),
        better: 'low',
      });
    }
    return list;
  }, [ar, gk, left, per90, right]);

  const radarKeys = gk
    ? ([
      [ar ? 'تصدي' : 'Saves', left.totals?.saves ?? 0, right.totals?.saves ?? 0],
      [ar ? 'تمرير' : 'Pass', left.totals?.passAccuracy ?? 0, right.totals?.passAccuracy ?? 0],
      [ar ? 'تقييم' : 'Rate', Number(left.totals?.rating || 0), Number(right.totals?.rating || 0)],
      [ar ? 'دقائق' : 'Mins', left.totals?.minutes ?? 0, right.totals?.minutes ?? 0],
    ] as const)
    : ([
      [ar ? 'أهداف' : 'Goals', left.totals?.goals ?? 0, right.totals?.goals ?? 0],
      [ar ? 'صناعة' : 'Ast', left.totals?.assists ?? 0, right.totals?.assists ?? 0],
      [ar ? 'تمرير' : 'Pass', left.totals?.passAccuracy ?? 0, right.totals?.passAccuracy ?? 0],
      [ar ? 'التحام' : 'Duel', left.rates?.duelWinPct ?? 0, right.rates?.duelWinPct ?? 0],
      [ar ? 'مراوغة' : 'Drib', left.rates?.dribbleSuccessPct ?? 0, right.rates?.dribbleSuccessPct ?? 0],
      [ar ? 'تقييم' : 'Rate', Number(left.totals?.rating || 0), Number(right.totals?.rating || 0)],
    ] as const);
  const max = radarKeys.map((row) => Math.max(row[1], row[2], 0.01));

  const qs = (leftSlug: string, rightSlug: string) => {
    const seasonQ = season ? `&season=${season}` : '';
    return `/compare-players?p1=${encodeURIComponent(leftSlug)}&p2=${encodeURIComponent(rightSlug)}${seasonQ}`;
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}${season ? `&season=${season}` : ''}`;
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={folio.board}>
      <div className={folio.boardTools}>
        <button type="button" onClick={() => setPer90((v) => !v)}>
          {per90 ? (ar ? 'إجمالي الموسم' : 'Season totals') : (ar ? 'لكل 90 دقيقة' : 'Per 90')}
        </button>
        <button type="button" onClick={() => router.push(qs(p2, p1))}>
          {ar ? '⇄ تبديل' : '⇄ Swap'}
        </button>
        <button type="button" onClick={copyLink} data-on={copied}>
          {copied ? (ar ? 'تم النسخ ✓' : 'Copied ✓') : (ar ? 'نسخ الرابط' : 'Copy link')}
        </button>
      </div>
      {left.totals || right.totals ? (
        radarKeys.filter((row) => row[1] > 0 || row[2] > 0).length >= 3 ? (
          <Radar
            labels={radarKeys.map((row) => row[0])}
            left={radarKeys.map((row, i) => row[1] / max[i])}
            right={radarKeys.map((row, i) => row[2] / max[i])}
          />
        ) : null
      ) : (
        <p className={folio.hint}>
          {ar
            ? 'لا تتوفر بيانات لهذا اللاعب في الموسم المحدد.'
            : 'No stats are available for these players in the selected season.'}
        </p>
      )}
      <div className={folio.statList}>
        {rows.map((stat) => {
          const bothMissing = stat.left == null && stat.right == null;
          if (bothMissing) return null;
          const l = stat.left ?? 0;
          const r = stat.right ?? 0;
          const total = l + r;
          const pct = bothMissing || total <= 0 ? 50 : Math.round((l / total) * 100);
          const leftWins =
            !bothMissing && stat.left != null && stat.right != null && (stat.better === 'low' ? l < r : l > r);
          const rightWins =
            !bothMissing && stat.left != null && stat.right != null && (stat.better === 'low' ? r < l : r > l);
          return (
            <div key={stat.key} className={folio.stat}>
              <div className={folio.statHead}>
                <span className={leftWins ? folio.win : undefined}>
                  {leftWins ? '▲ ' : ''}
                  {cell(stat.left)}
                </span>
                <em>{stat.label}</em>
                <span className={rightWins ? folio.win : undefined}>
                  {cell(stat.right)}
                  {rightWins ? ' ▲' : ''}
                </span>
              </div>
              <div className={folio.bar} aria-hidden>
                <i style={{ width: `${pct}%`, opacity: bothMissing ? 0.35 : 1 }} />
                <i style={{ width: `${100 - pct}%`, opacity: bothMissing ? 0.25 : 1 }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className={folio.hint}>
        {ar
          ? `مصدر البيانات: ${left.provider === 'api-football' || right.provider === 'api-football' ? 'API-Football' : 'السجلات المحفوظة'} · آخر تحديث: ${new Date(
            Math.max(new Date(left.fetchedAt).getTime(), new Date(right.fetchedAt).getTime()),
          ).toLocaleString(locale === 'ar' ? 'ar' : 'en')}`
          : `Source: ${left.provider === 'api-football' || right.provider === 'api-football' ? 'API-Football' : 'stored records'} · Updated: ${new Date(
            Math.max(new Date(left.fetchedAt).getTime(), new Date(right.fetchedAt).getTime()),
          ).toLocaleString('en')}`}
      </p>
    </div>
  );
}
