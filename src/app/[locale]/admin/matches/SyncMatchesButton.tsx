'use client';

import { useState } from 'react';
import { triggerSportsSync } from './actions';

export function SyncMatchesButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setNote(null);
          const result = await triggerSportsSync();
          setPending(false);
          setNote(
            result.ok
              ? `${result.synced ?? 0}`
              : result.error || 'failed'
          );
        }}
        className="rounded-2xl bg-foreground px-6 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {pending ? busyLabel : label}
      </button>
      {note ? <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{note}</span> : null}
    </div>
  );
}
