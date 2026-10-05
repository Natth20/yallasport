'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

export function FrontShareBtn({ href, label }: { href: string; label: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const url = href.startsWith('http') ? href : `${window.location.origin}${href}`;
        try {
          if (navigator.share) {
            await navigator.share({ url });
          } else {
            await navigator.clipboard.writeText(url);
          }
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          /* user cancelled */
        }
      }}
      style={{
        background: 'none',
        border: 0,
        padding: 0,
        color: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <Share2 size={14} />
      {done ? <span style={{ marginInlineStart: 4, fontSize: '0.65rem' }}>✓</span> : null}
    </button>
  );
}
