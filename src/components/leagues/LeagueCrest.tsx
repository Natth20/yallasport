export function LeagueCrest({
  name,
  logoUrl,
  className = '',
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const src = logoUrl?.trim();
  if (src) {
    return <img src={src} alt="" className={`object-contain ${className}`} />;
  }
  const mark = name.trim().charAt(0) || '•';
  return (
    <span className={`flex items-center justify-center font-serif font-semibold text-orange-500 ${className}`}>
      {mark}
    </span>
  );
}
