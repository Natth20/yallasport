import React from 'react';

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="league-salon-page min-h-screen pb-20">
      <article className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <p className="text-[11px] font-medium text-muted-foreground">{updated}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground dark:text-foreground">{title}</h1>
        <div className="legal-copy mt-10 space-y-8 text-[15px] leading-8 text-foreground dark:text-muted-foreground">
          {children}
        </div>
      </article>
    </div>
  );
}
