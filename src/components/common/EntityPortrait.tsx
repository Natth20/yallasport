export function EntityPortrait({
  name,
  size,
  className = '',
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const letter = (name || '').trim().charAt(0) || '•';
  return (
    <span
      className={`ys-portrait ${className}`.trim()}
      style={size ? { width: size, height: size, fontSize: Math.max(11, size * 0.42) } : undefined}
      aria-hidden
    >
      {letter}
    </span>
  );
}
