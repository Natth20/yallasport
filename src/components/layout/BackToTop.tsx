'use client';

import { ArrowUp } from 'lucide-react';

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-card/[0.04] text-white/70 shadow-[0_0_0_4px_rgba(249,115,22,0.06)] transition-all duration-300 hover:border-orange-400/40 hover:bg-orange-500 hover:text-primary-foreground hover:shadow-[0_0_0_6px_rgba(249,115,22,0.16)]"
      aria-label={label}
      title={label}
    >
      <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
