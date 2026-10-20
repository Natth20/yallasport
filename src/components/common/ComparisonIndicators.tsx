'use client';

import React from 'react';

export interface ComparisonMetric {
  key: string;
  label: string;
  subLabel?: string;
  left: number | null | undefined;
  right: number | null | undefined;
  better?: 'high' | 'low';
  suffix?: string;
  formatValue?: (val: number | null | undefined) => string;
}

export interface ComparisonCategory {
  id: string;
  title: string;
  periodBadge?: string;
  icon?: React.ReactNode;
  metrics: ComparisonMetric[];
}

function defaultFormat(val: number | null | undefined, suffix = ''): string {
  if (val == null || Number.isNaN(val)) return '—';
  const formatted = Number.isInteger(val) ? String(val) : String(Number(val.toFixed(2)));
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export function ComparisonMetricBar({
  metric,
  leftLabel,
  rightLabel,
}: {
  metric: ComparisonMetric;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const { label, subLabel, left, right, better = 'high', suffix = '', formatValue } = metric;
  const bothMissing = left == null && right == null;
  if (bothMissing) return null;

  const lNum = left ?? 0;
  const rNum = right ?? 0;

  // Winner calculation
  const hasBoth = left != null && right != null;
  const leftWins = hasBoth && (better === 'low' ? lNum < rNum : lNum > rNum);
  const rightWins = hasBoth && (better === 'low' ? rNum < lNum : rNum > lNum);
  const isTie = hasBoth && lNum === rNum;

  // Bar percentage calculation
  let leftPct = 50;
  if (!bothMissing) {
    if (better === 'low') {
      // Invert for low is better (e.g. rank 1 should have a larger bar than rank 4)
      const maxVal = Math.max(lNum, rNum, 1);
      const leftInverted = Math.max(0.1, maxVal - lNum + 1);
      const rightInverted = Math.max(0.1, maxVal - rNum + 1);
      const sumInv = leftInverted + rightInverted;
      leftPct = Math.round((leftInverted / sumInv) * 100);
    } else {
      const sum = lNum + rNum;
      leftPct = sum > 0 ? Math.round((lNum / sum) * 100) : 50;
    }
  }

  // Value formatting
  const leftDisplay = formatValue ? formatValue(left) : defaultFormat(left, suffix);
  const rightDisplay = formatValue ? formatValue(right) : defaultFormat(right, suffix);

  return (
    <div className="group relative rounded-xl sm:rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-3.5 backdrop-blur-md transition-all duration-200 hover:border-orange-500/40 hover:bg-card hover:shadow-md">
      {/* Metrics Value & Label Row */}
      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left Side Value */}
        <div className="flex items-center gap-1.5 min-w-[3.5rem] sm:min-w-[4.5rem]">
          <span
            className={`font-black tabular-nums transition-colors ${
              leftWins
                ? 'text-emerald-500 dark:text-emerald-400 font-extrabold text-sm sm:text-base drop-shadow-xs'
                : isTie
                ? 'text-foreground/90 font-bold'
                : 'text-muted-foreground/90'
            }`}
          >
            {leftWins ? <span className="text-[11px] me-0.5 select-none font-bold">▲</span> : null}
            {leftDisplay}
          </span>
          {leftWins ? (
            <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          ) : null}
        </div>

        {/* Center Indicator Title & Subtitle */}
        <div className="flex flex-col items-center text-center px-1">
          <span className="font-extrabold text-foreground text-xs sm:text-[13px] leading-tight">
            {label}
          </span>
          {subLabel ? (
            <span className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
              {subLabel}
            </span>
          ) : null}
        </div>

        {/* Right Side Value */}
        <div className="flex items-center justify-end gap-1.5 min-w-[3.5rem] sm:min-w-[4.5rem] text-end">
          {rightWins ? (
            <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          ) : null}
          <span
            className={`font-black tabular-nums transition-colors ${
              rightWins
                ? 'text-orange-500 dark:text-orange-400 font-extrabold text-sm sm:text-base drop-shadow-xs'
                : isTie
                ? 'text-foreground/90 font-bold'
                : 'text-muted-foreground/90'
            }`}
          >
            {rightDisplay}
            {rightWins ? <span className="text-[11px] ms-0.5 select-none font-bold">▲</span> : null}
          </span>
        </div>
      </div>

      {/* Proportional Dual Bar */}
      <div
        className="relative mt-2.5 flex h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-muted/40 p-0.5 border border-border/40"
        aria-hidden="true"
      >
        {/* Left Segment */}
        <div
          style={{ width: `${leftPct}%` }}
          className={`h-full rounded-s-full transition-all duration-500 ${
            leftWins
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
              : 'bg-muted-foreground/40'
          }`}
        />

        {/* Right Segment */}
        <div
          style={{ width: `${100 - leftPct}%` }}
          className={`h-full rounded-e-full transition-all duration-500 ${
            rightWins
              ? 'bg-gradient-to-l from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
              : 'bg-muted-foreground/30'
          }`}
        />
      </div>
    </div>
  );
}

export function ComparisonGroupCard({
  category,
  leftLabel,
  rightLabel,
}: {
  category: ComparisonCategory;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const visibleMetrics = category.metrics.filter(
    (m) => !(m.left == null && m.right == null)
  );
  if (visibleMetrics.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl sm:rounded-3xl border border-border/70 bg-gradient-to-br from-card/95 via-card/80 to-card/60 p-4 sm:p-5 backdrop-blur-xl shadow-md">
      {/* Group Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          {category.icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
              {category.icon}
            </span>
          ) : null}
          <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
            {category.title}
          </h3>
        </div>

        {category.periodBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground border border-border/40">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500/80" />
            {category.periodBadge}
          </span>
        ) : null}
      </div>

      {/* Side Entity Header Indicators */}
      {leftLabel && rightLabel ? (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/30 border border-border/30 text-xs font-black">
          <div className="flex items-center gap-1.5 text-foreground/90">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="truncate max-w-[140px] sm:max-w-[220px]">{leftLabel}</span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold select-none">
            VS
          </span>
          <div className="flex items-center gap-1.5 text-foreground/90">
            <span className="truncate max-w-[140px] sm:max-w-[220px]">{rightLabel}</span>
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
          </div>
        </div>
      ) : null}

      {/* Metrics List */}
      <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
        {visibleMetrics.map((metric) => (
          <ComparisonMetricBar
            key={metric.key}
            metric={metric}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
        ))}
      </div>
    </div>
  );
}
