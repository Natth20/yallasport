'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import styles from './auth-gate.module.css';

export function AuthGoogleButton({
  intent,
  callbackUrl = '/',
}: {
  intent: 'login' | 'register';
  callbackUrl?: string;
}) {
  const t = useTranslations('auth');
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signIn('google', { callbackUrl });
      }}
      className={styles.google}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
      <span>{intent === 'register' ? t('google_register') : t('google')}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.8.6-2.3 1.8C5.2 19.4 8.4 21.2 12 21.2c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.7 0-5-1.8-5.8-4.3z"
      />
      <path
        fill="#4A90E2"
        d="M3.5 7.3C2.7 8.8 2.3 10.4 2.3 12s.4 3.2 1.2 4.7l3.1-2.4c-.4-1.1-.6-2.2-.6-2.3s.2-1.2.6-2.3L3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.6 14.7 1.8 12 1.8 8.4 1.8 5.2 3.6 3.5 6.6L6.6 9c.8-2.5 3.1-3.4 5.4-3.4z"
      />
    </svg>
  );
}
