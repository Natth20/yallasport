'use client';

import React, { useState } from 'react';
import { updateProfile } from './actions';

export function ProfileEditForm({
  locale,
  initialName,
  email,
}: {
  locale: string;
  initialName: string;
  email: string;
}) {
  const ar = locale === 'ar';
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-5"
      action={async (formData) => {
        setPending(true);
        setMessage(null);
        const result = await updateProfile(formData);
        setPending(false);
        if (!result?.ok) {
          setMessage(ar ? 'الاسم قصير جداً.' : 'Name is too short.');
          return;
        }
        setMessage(ar ? 'تم حفظ الاسم.' : 'Name saved.');
      }}
    >
      <label className="block">
        <span className="mb-2 block text-xs font-bold">{ar ? 'الاسم الظاهر' : 'Display name'}</span>
        <input
          name="name"
          defaultValue={initialName}
          required
          minLength={2}
          maxLength={80}
          className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-orange-500/40"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-bold">{ar ? 'البريد' : 'Email'}</span>
        <input
          value={email}
          disabled
          className="h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm text-muted-foreground"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"
      >
        {pending ? (ar ? 'جاري الحفظ…' : 'Saving…') : ar ? 'حفظ' : 'Save'}
      </button>
      {message ? <p className="text-sm font-bold text-emerald-500">{message}</p> : null}
    </form>
  );
}
