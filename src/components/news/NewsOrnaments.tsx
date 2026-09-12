import React from 'react';

/** Ornamental double rule with a centre gem — match-programme divider. */
export function DeskRule({ className = '' }: { className?: string }) {
  return (
    <div className={`desk-rule ${className}`} aria-hidden>
      <span className="desk-rule-line" />
      <span className="desk-rule-gem" />
      <span className="desk-rule-line" />
    </div>
  );
}

/** Photo-print corner brackets for cover / hero frames. */
export function PhotoCorners({ className = '' }: { className?: string }) {
  return (
    <div className={`photo-corners ${className}`} aria-hidden>
      <i className="pc-tl" />
      <i className="pc-tr" />
      <i className="pc-bl" />
      <i className="pc-br" />
    </div>
  );
}

/** Small pressed edition plate for the desk mast. */
export function EditionPlate({
  year,
  label,
  className = '',
}: {
  year: number | string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`edition-plate ${className}`} aria-hidden>
      <span className="edition-plate-year">{year}</span>
      <span className="edition-plate-label">{label}</span>
    </div>
  );
}

/** Vertical running folio along a story column. */
export function StorySpine({
  mark = 'YS',
  folio,
  className = '',
}: {
  mark?: string;
  folio?: string;
  className?: string;
}) {
  return (
    <div className={`story-spine ${className}`} aria-hidden>
      <span>{mark}</span>
      {folio ? <span className="story-spine-folio">{folio}</span> : null}
    </div>
  );
}

/** End-of-copy printer’s mark. */
export function EndMark({ className = '' }: { className?: string }) {
  return (
    <div className={`story-end-mark ${className}`} aria-hidden>
      <span />
      <strong>YS</strong>
      <span />
    </div>
  );
}
