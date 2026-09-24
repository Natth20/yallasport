'use client';

import { useEffect, useRef, useState } from 'react';

export type LexRailItem = { id: string; label: string };

export function LexProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>('.lex-scroll');
    if (!target) return;

    const update = () => {
      const rect = target.getBoundingClientRect();
      const start = rect.top + window.scrollY - window.innerHeight * 0.35;
      const span = rect.height - window.innerHeight * 0.35;
      if (span <= 0) {
        setValue(1);
        return;
      }
      const ratio = (window.scrollY - start) / span;
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

  // return (
  //   <div className="lex-progress" aria-hidden>
  //     <span style={{ transform: `scaleX(${value})` }} />
  //   </div>
  // );
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
  const [read, setRead] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0) return;

    const pickActive = () => {
      const line = window.innerHeight * 0.32;
      let current = sections[0];
      for (const node of sections) {
        if (node.getBoundingClientRect().top <= line) current = node;
      }
      setActive(current.id);
      const index = sections.findIndex((node) => node.id === current.id);
      setRead(Math.round(((index + 1) / sections.length) * 100));
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
    const node = list.querySelector<HTMLElement>('[data-active="1"]');
    if (!node) return;
    const top = node.offsetTop - list.clientHeight / 2 + node.clientHeight / 2;
    list.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [active]);

  return (
    <div className="lex-rail-inner">
      <p className="lex-rail-head">
        <span>{heading}</span>
        <b>{String(items.length).padStart(2, '0')}</b>
      </p>

      <ol className="lex-rail-list" ref={listRef}>
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-active={item.id === active ? '1' : undefined}
              aria-current={item.id === active ? 'true' : undefined}
            >
              <em>{String(index + 1).padStart(2, '0')}</em>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ol>

      <div className="lex-rail-meter">
        <p>
          <span>{readLabel}</span>
          <b>{read}%</b>
        </p>
        <i>
          <span style={{ width: `${read}%` }} />
        </i>
      </div>
    </div>
  );
}
