'use client';

import { LogOut } from 'lucide-react';
import { signOutAction } from '@/lib/auth/sign-out';

export function SignOutButton({
  locale,
  label,
  className,
}: {
  locale: string;
  label: string;
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={className}>
        <LogOut className="h-5 w-5" />
        {label}
      </button>
    </form>
  );
}
