/** Keep post-login redirects inside this site. */
export function safeCallbackPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return fallback;
  }
  return value;
}
