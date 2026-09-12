import React from 'react';

export function CompassRose({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
      <circle cx="50" cy="50" r="4" fill="#f97316" />
      <polygon points="50,6 54,50 50,44 46,50" fill="#f97316" />
      <polygon points="50,94 54,50 50,56 46,50" fill="#c4a574" />
      <polygon points="6,50 50,46 44,50 50,54" fill="#d6c4a3" />
      <polygon points="94,50 50,46 56,50 50,54" fill="#d6c4a3" />
      <text x="50" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ea580c">
        N
      </text>
    </svg>
  );
}

export function PitchWatermark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 140" className={className} aria-hidden>
      <rect x="6" y="6" width="208" height="128" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="110" y1="6" x2="110" y2="134" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="110" cy="70" r="22" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="110" cy="70" r="2.2" fill="currentColor" />
      <rect x="6" y="42" width="32" height="56" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="182" y="42" width="32" height="56" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="6" y="54" width="14" height="32" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="200" y="54" width="14" height="32" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function TicketBarcode({ className = '' }: { className?: string }) {
  const bars = [10, 16, 8, 18, 12, 20, 7, 16, 11, 19, 8, 14, 18, 9, 16, 12, 20, 8, 15];
  return (
    <div className={`flex h-7 items-end gap-[2px] ${className}`} aria-hidden>
      {bars.map((height, index) => (
        <span key={index} className="w-[2px] rounded-full bg-current" style={{ height: `${height}px` }} />
      ))}
    </div>
  );
}

export function IndexFolio({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <rect x="10" y="10" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <rect x="16" y="16" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="0.45" opacity="0.45" />
      <line x1="10" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="0.4" opacity="0.28" />
      <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="0.4" opacity="0.28" />
      <circle cx="40" cy="40" r="2.2" fill="#ea580c" />
    </svg>
  );
}

export function WaxSeal({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`edition-seal flex h-[4.5rem] w-[4.5rem] rotate-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800 text-center text-[9px] font-bold uppercase leading-3 tracking-[0.16em] text-white ring-4 ring-border ${className}`}
      aria-hidden
    >
      <span className="whitespace-pre-line">{label}</span>
    </div>
  );
}
