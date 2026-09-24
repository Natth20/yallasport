export function pushProvenance(current: unknown, entry: Record<string, unknown>) {
  const list = Array.isArray(current) ? [...current] : [];
  list.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  return list;
}
