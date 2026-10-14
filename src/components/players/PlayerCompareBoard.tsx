'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { PlayerCompareCard } from '@/lib/players/load-dossier';
import {
  ComparisonGroupCard,
  type ComparisonCategory,
  type ComparisonMetric,
} from '@/components/common/ComparisonIndicators';
import { Activity, Flame, Shield, Target, Award } from 'lucide-react';
import folio from './compare-folio.module.css';

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
    <svg viewBox="0 0 240 240" className={folio.radar} role="img" aria-label="Player Comparison Radar Chart">
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

  const seasonNote = left.season || right.season || season;
  const periodLabel = per90
    ? (ar ? 'معدلات لكل 90 دقيقة' : 'Per 90 Mins')
    : (ar ? `إجمالي موسم ${seasonNote ? `${seasonNote}/${seasonNote + 1}` : ''}` : `Season Totals ${seasonNote ? `${seasonNote}/${seasonNote + 1}` : ''}`);

  const categories: ComparisonCategory[] = useMemo(() => {
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

    const result: ComparisonCategory[] = [
      {
        id: 'overview',
        title: ar ? 'المشاركة والتقييم العام' : 'Appearances & Rating',
        periodBadge: seasonNote ? (ar ? `موسم ${seasonNote}/${seasonNote + 1}` : `${seasonNote}/${seasonNote + 1} Season`) : undefined,
        icon: <Activity size={16} />,
        metrics: [
          {
            key: 'rating',
            label: ar ? 'التقييم العام' : 'Overall Rating',
            subLabel: ar ? 'من 10' : 'out of 10',
            left: take(left, 'rating' as never) ?? (left.totals?.rating ? Number(left.totals.rating) : null),
            right: right.totals?.rating ? Number(right.totals.rating) : null,
          },
          {
            key: 'apps',
            label: ar ? 'المشاركات الرسمية' : 'Appearances',
            subLabel: ar ? 'مباراة' : 'matches',
            left: take(left, 'appearances'),
            right: take(right, 'appearances'),
          },
          {
            key: 'mins',
            label: ar ? 'الدقائق الملعوبة' : 'Minutes Played',
            subLabel: ar ? 'دقيقة' : 'mins',
            left: take(left, 'minutes'),
            right: take(right, 'minutes'),
          },
        ],
      },
      {
        id: 'attacking',
        title: ar ? 'الإنتاج الهجومي والتهديف' : 'Attacking & Goals',
        periodBadge: periodLabel,
        icon: <Flame size={16} />,
        metrics: [
          {
            key: 'goals',
            label: per90 ? (ar ? 'أهداف / 90 دقيقة' : 'Goals / 90') : (ar ? 'الأهداف المسجلة' : 'Goals Scored'),
            left: per(left, 'goals'),
            right: per(right, 'goals'),
          },
          {
            key: 'assists',
            label: per90 ? (ar ? 'صناعات / 90 دقيقة' : 'Assists / 90') : (ar ? 'التمريرات الحاسمة (أسيست)' : 'Assists'),
            left: per(left, 'assists'),
            right: per(right, 'assists'),
          },
          {
            key: 'shotsOn',
            label: per90 ? (ar ? 'تسديدات على المرمى / 90' : 'Shots on target / 90') : (ar ? 'التسديدات على المرمى' : 'Shots on Target'),
            left: per(left, 'shotsOn'),
            right: per(right, 'shotsOn'),
          },
          {
            key: 'shotAcc',
            label: ar ? 'دقة التسديد' : 'Shot Accuracy',
            suffix: '%',
            left: left.rates?.shotAccuracy ?? null,
            right: right.rates?.shotAccuracy ?? null,
          },
        ],
      },
      {
        id: 'playmaking',
        title: ar ? 'صناعة اللعب والتمرير' : 'Passing & Creation',
        periodBadge: periodLabel,
        icon: <Target size={16} />,
        metrics: [
          {
            key: 'key',
            label: per90 ? (ar ? 'فرص مصنوعة / 90' : 'Key Passes / 90') : (ar ? 'الفرص المصنوعة' : 'Key Passes'),
            left: per(left, 'keyPasses'),
            right: per(right, 'keyPasses'),
          },
          {
            key: 'pass',
            label: ar ? 'دقة التمرير' : 'Pass Accuracy',
            suffix: '%',
            left: left.totals?.passAccuracy ?? null,
            right: right.totals?.passAccuracy ?? null,
          },
          {
            key: 'drib',
            label: ar ? 'نجاح المراوغات' : 'Dribble Success',
            suffix: '%',
            left: left.rates?.dribbleSuccessPct ?? null,
            right: right.rates?.dribbleSuccessPct ?? null,
          },
        ],
      },
      {
        id: 'discipline',
        title: ar ? 'الالتحامات والانضباط الدفاعي' : 'Duels & Discipline',
        periodBadge: ar ? 'السجل البدني والانضباطي' : 'Physical & Disciplinary',
        icon: <Shield size={16} />,
        metrics: [
          {
            key: 'duel',
            label: ar ? 'الفوز بالالتحامات' : 'Duel Win %',
            suffix: '%',
            left: left.rates?.duelWinPct ?? null,
            right: right.rates?.duelWinPct ?? null,
          },
          {
            key: 'tackles',
            label: per90 ? (ar ? 'تدخلات / 90' : 'Tackles / 90') : (ar ? 'التدخلات الدفاعية الناجحة' : 'Successful Tackles'),
            left: per(left, 'tackles'),
            right: per(right, 'tackles'),
          },
          {
            key: 'yellow',
            label: ar ? 'البطاقات الصفراء' : 'Yellow Cards',
            subLabel: ar ? 'الأقل أفضل' : 'lower is better',
            better: 'low',
            left: take(left, 'yellow'),
            right: take(right, 'yellow'),
          },
          {
            key: 'red',
            label: ar ? 'البطاقات الحمراء' : 'Red Cards',
            subLabel: ar ? 'الأقل أفضل' : 'lower is better',
            better: 'low',
            left: take(left, 'red'),
            right: take(right, 'red'),
          },
        ],
      },
    ];

    if (gk) {
      result.push({
        id: 'goalkeeping',
        title: ar ? 'كفاءة حراسة المرمى' : 'Goalkeeping Efficiency',
        periodBadge: periodLabel,
        icon: <Award size={16} />,
        metrics: [
          {
            key: 'saves',
            label: per90 ? (ar ? 'تصديات / 90 د' : 'Saves / 90') : (ar ? 'إجمالي التصديات' : 'Total Saves'),
            left: per(left, 'saves'),
            right: per(right, 'saves'),
          },
          {
            key: 'conc',
            label: ar ? 'الأهداف المستقبلة' : 'Goals Conceded',
            subLabel: ar ? 'الأقل أفضل' : 'lower is better',
            better: 'low',
            left: take(left, 'conceded'),
            right: take(right, 'conceded'),
          },
        ],
      });
    }

    return result;
  }, [ar, gk, left, per90, periodLabel, right, seasonNote]);

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
    <div className="flex flex-col gap-6">
      {/* Interactive Tool Actions Ribbon */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 p-2 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setPer90((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
            per90
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-muted/70 text-foreground hover:bg-muted'
          }`}
        >
          {per90 ? (ar ? '✓ لكل 90 دقيقة' : '✓ Per 90 Mins') : (ar ? 'إجمالي الموسم' : 'Season Totals')}
        </button>

        <button
          type="button"
          onClick={() => router.push(qs(p2, p1))}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-muted/70 text-foreground hover:bg-muted transition-all"
        >
          {ar ? '⇄ تبديل اللاعبين' : '⇄ Swap'}
        </button>

        <button
          type="button"
          onClick={copyLink}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
            copied
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-muted/70 text-foreground hover:bg-muted'
          }`}
        >
          {copied ? (ar ? 'تم النسخ ✓' : 'Copied ✓') : (ar ? 'نسخ الرابط' : 'Copy link')}
        </button>
      </div>

      {/* Radar Chart (Visual Poly Map) */}
      {left.totals || right.totals ? (
        radarKeys.filter((row) => row[1] > 0 || row[2] > 0).length >= 3 ? (
          <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-card/60 border border-border/60 backdrop-blur-md">
            <span className="text-xs font-black text-muted-foreground mb-1">
              {ar ? 'رادار التوازن الإحصائي' : 'Statistical Balance Radar'}
            </span>
            <Radar
              labels={radarKeys.map((row) => row[0])}
              left={radarKeys.map((row, i) => row[1] / max[i])}
              right={radarKeys.map((row, i) => row[2] / max[i])}
            />
            <div className="flex items-center gap-5 text-xs font-extrabold mt-1">
              <span className="flex items-center gap-1.5 text-foreground/80">
                <span className="h-2 w-2 rounded-full bg-foreground/60" />
                {left.name}
              </span>
              <span className="flex items-center gap-1.5 text-orange-500">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                {right.name}
              </span>
            </div>
          </div>
        ) : null
      ) : (
        <p className="text-center text-xs text-muted-foreground py-6">
          {ar
            ? 'لا تتوفر إحصائيات كافية لهذا اللاعب في الموسم المحدد.'
            : 'No stats are available for these players in the selected season.'}
        </p>
      )}

      {/* Unified Categorical Comparison Groups */}
      <div className="grid grid-cols-1 gap-5">
        {categories.map((cat) => (
          <ComparisonGroupCard
            key={cat.id}
            category={cat}
            leftLabel={left.name}
            rightLabel={right.name}
          />
        ))}
      </div>

      {/* Provenance and Data Source Footer */}
      <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center text-[11px] text-muted-foreground">
        {ar
          ? `مصدر البيانات: ${left.provider === 'api-football' || right.provider === 'api-football' ? 'شبكة البيانات الرياضية API-Football المعتمدة' : 'السجلات الرسمية المحفوظة'} · التحديث الموثق: ${new Date(
            Math.max(new Date(left.fetchedAt).getTime(), new Date(right.fetchedAt).getTime()),
          ).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}`
          : `Source: ${left.provider === 'api-football' || right.provider === 'api-football' ? 'Official API-Football Sports Data' : 'Verified Database Records'} · Updated: ${new Date(
            Math.max(new Date(left.fetchedAt).getTime(), new Date(right.fetchedAt).getTime()),
          ).toLocaleDateString('en-US')}`}
      </div>
    </div>
  );
}
