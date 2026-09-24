import { reportCaughtError } from '@/lib/ops/caught';
export function canonicalNewsUrl(raw?: string | null) {
  if (!raw?.trim()) return '';
  try {
    const url = new URL(raw.trim());
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString();
  } catch (error) {
    reportCaughtError("src/lib/news/canonical-url.ts:9", error);
    return raw.trim();
  }
}

export function newsUrlAliases(raw?: string | null) {
  const canonical = canonicalNewsUrl(raw);
  if (!canonical) return [];
  const aliases = new Set([raw!.trim(), canonical]);
  if (canonical.endsWith('/')) aliases.add(canonical.slice(0, -1));
  else aliases.add(`${canonical}/`);
  return [...aliases];
}
