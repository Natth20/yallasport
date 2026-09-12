export function FootballLoader({
  caption,
  title,
}: {
  caption?: string;
  title?: string;
}) {
  return (
    <div className="ys-loader flex min-h-[70vh] flex-col items-center justify-center px-6">
      <div className="ys-loader-ball" aria-hidden>
        <span className="ys-loader-aura" />
        <svg className="ys-loader-svg" viewBox="0 0 96 96" fill="none">
          <defs>
            <radialGradient id="ysBallSkin" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#f7f2ea" />
              <stop offset="100%" stopColor="#d9cfc3" />
            </radialGradient>
            <filter id="ysBallSoft" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#f97316" floodOpacity="0.22" />
            </filter>
          </defs>
          <circle cx="48" cy="48" r="34" fill="url(#ysBallSkin)" filter="url(#ysBallSoft)" />
          <circle cx="48" cy="48" r="34" stroke="#0f172a" strokeWidth="2.4" />
          <polygon points="48,30 58.2,37.4 54.4,49.2 41.6,49.2 37.8,37.4" fill="#0f172a" className="ys-loader-panel" />
          <path className="ys-loader-stitch" d="M48 30L58.2 37.4L70 28" />
          <path className="ys-loader-stitch" d="M58.2 37.4L54.4 49.2L70 58" />
          <path className="ys-loader-stitch" d="M54.4 49.2L41.6 49.2L48 68" />
          <path className="ys-loader-stitch" d="M41.6 49.2L37.8 37.4L26 28" />
          <path className="ys-loader-stitch" d="M37.8 37.4L48 30L26 28" />
          <path className="ys-loader-stitch" d="M70 28C78 38 80 48 76 60" />
          <path className="ys-loader-stitch" d="M26 28C18 38 16 48 20 60" />
          <path className="ys-loader-stitch" d="M70 58C64 70 56 76 48 78C40 76 32 70 26 58" />
        </svg>
        <span className="ys-loader-shadow" />
      </div>

      <div className="ys-loader-copy">
        {caption ? <span className="ys-loader-caption">{caption}</span> : null}
        {title ? <p className="ys-loader-title">{title}</p> : null}
      </div>
    </div>
  );
}
