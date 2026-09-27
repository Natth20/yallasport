import type { ReactNode } from 'react';

export function MetaLine({ parts, className }: { parts: Array<ReactNode>; className?: string }) {
  const items = parts.filter((part) => part !== null && part !== undefined && part !== false && part !== '');
  if (items.length === 0) return null;
  return (
    <span className={className}>
      {items.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          {part}
        </span>
      ))}
    </span>
  );
}
