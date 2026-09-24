export function isAbortError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name: unknown }).name) : '';
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return name === 'AbortError' || /aborted without reason|The operation was aborted/i.test(message);
}

export function reportCaughtError(scope: string, error: unknown, options?: { persist?: boolean }) {
  if (isAbortError(error)) return;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[caught:${scope}]`, message);
  const persist = options?.persist !== false;
  if (!persist || typeof window !== 'undefined') return;
  const persistAlert = (globalThis as { __ysPersistCaught?: (s: string, m: string) => void }).__ysPersistCaught;
  persistAlert?.(scope, message);
}

export function swallow<T>(scope: string, fallback: T, options?: { persist?: boolean }) {
  return (error: unknown): T => {
    reportCaughtError(scope, error, options);
    return fallback;
  };
}
