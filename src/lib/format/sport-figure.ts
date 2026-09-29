export function formatSportFigure(value: string | number | null | undefined) {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}
