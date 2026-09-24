'use client';

import { useEffect, useRef, useState } from 'react';

function Digit({ value }: { value: number | null }) {
  const label = typeof value === 'number' ? String(value) : '—';
  const prev = useRef(label);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    if (prev.current === label) return;
    prev.current = label;
    if (label === '—') return;
    setTick(true);
    const id = window.setTimeout(() => setTick(false), 420);
    return () => window.clearTimeout(id);
  }, [label]);

  return <span className={tick ? 'is-tick' : undefined}>{label}</span>;
}

export function LiveScoreDigits({
  home,
  away,
}: {
  home: number | null | undefined;
  away: number | null | undefined;
}) {
  return (
    <strong className="match-score-digits" dir="ltr">
      <Digit value={typeof home === 'number' ? home : null} />
      <em>:</em>
      <Digit value={typeof away === 'number' ? away : null} />
    </strong>
  );
}
