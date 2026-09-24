'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ListOrdered, ArrowUpRight } from 'lucide-react';
import styles from './lex.module.css';

export type LexRailItem = { id: string; label: string };

export function LexProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setValue(0);
        return;
      }
      const ratio = window.scrollY / scrollHeight;
      setValue(Math.min(1, Math.max(0, ratio)));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className="fixed top-0 inset-x-0 h-1 z-50 pointer-events-none bg-black/10 dark:bg-white/5"
      aria-hidden
    >
      <div
        className="h-full bg-[var(--lex-accent)] transition-all duration-150 ease-out shadow-[0_0_12px_var(--lex-accent)]"
        style={{
          width: `${Math.round(value * 100)}%`,
          transformOrigin: 'start',
        }}
      />
    </div>
  );
}

export function LexRail({
  items,
  heading,
  readLabel,
}: {
  items: LexRailItem[];
  heading: string;
  readLabel: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [readPct, setReadPct] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0) return;

    const pickActive = () => {
      const threshold = window.innerHeight * 0.35;
      let current = sections[0];
      for (const node of sections) {
        if (node.getBoundingClientRect().top <= threshold) {
          current = node;
        }
      }
      setActive(current.id);
      const index = sections.findIndex((node) => node.id === current.id);
      setReadPct(Math.round(((index + 1) / sections.length) * 100));
    };

    pickActive();
    window.addEventListener('scroll', pickActive, { passive: true });
    window.addEventListener('resize', pickActive);
    return () => {
      window.removeEventListener('scroll', pickActive);
      window.removeEventListener('resize', pickActive);
    };
  }, [items]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const node = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!node) return;
    const top = node.offsetTop - list.clientHeight / 2 + node.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [active]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles['lex-rail-card']}>
      <div className={styles['lex-rail-header']}>
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-[var(--lex-accent)]" />
          <span className={styles['lex-rail-title']}>{heading}</span>
        </div>
        <span className={styles['lex-rail-progress-pct']}>{readPct}%</span>
      </div>

      <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-[var(--lex-accent)] h-full transition-all duration-300 rounded-full"
          style={{ width: `${readPct}%` }}
        />
      </div>

      <ul className={styles['lex-rail-list']} ref={listRef}>
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`${styles['lex-rail-link']} group`}
              data-active={item.id === active ? 'true' : 'false'}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(item.id);
                if (target) {
                  const y = target.getBoundingClientRect().top + window.scrollY - 90;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
            >
              <span className="text-[10px] font-mono font-bold opacity-60 group-hover:opacity-100">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="truncate flex-1">{item.label}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          </li>
        ))}
      </ul>

      <button
        onClick={scrollToTop}
        type="button"
        className="mt-3 w-full py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-lg border border-border/60 hover:border-[var(--lex-accent)] text-muted-foreground hover:text-[var(--lex-accent)] hover:bg-[var(--lex-accent-soft)] transition-all cursor-pointer"
      >
        <ChevronUp className="w-3.5 h-3.5" />
        <span>{readLabel === 'Read so far' ? 'Back to top' : 'العودة للأعلى'}</span>
      </button>
    </div>
  );
}
