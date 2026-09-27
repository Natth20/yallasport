'use client';

import React, { useState } from 'react';
import { updateProfile } from './actions';
import { pick } from '@/i18n/pick';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './edit.module.css';

export function ProfileEditForm({
  locale,
  initialName,
  email,
}: {
  locale: string;
  initialName: string;
  email: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className={styles.form}
      action={async (formData) => {
        setPending(true);
        setMessage(null);
        const result = await updateProfile(formData);
        setPending(false);
        if (!result?.ok) {
          setMessage(pick(locale, 'الاسم قصير جداً.', 'Name is too short.'));
          return;
        }
        setMessage(pick(locale, 'تم حفظ الاسم.', 'Name saved.'));
      }}
    >
      <Input
        name="name"
        label={pick(locale, 'الاسم الظاهر', 'Display name')}
        defaultValue={initialName}
        required
        minLength={2}
        maxLength={80}
        inputSize="lg"
      />
      <Input
        label={pick(locale, 'البريد', 'Email')}
        value={email}
        disabled
        inputSize="lg"
        helperText={pick(locale, 'مربوط بحساب Google ولا يُعدَّل من هنا.', 'Bound to Google and cannot be changed here.')}
      />
      <Button type="submit" variant="accent" disabled={pending} isLoading={pending}>
        {pending ? pick(locale, 'جاري الحفظ…', 'Saving…') : pick(locale, 'حفظ', 'Save')}
      </Button>
      {message ? <p className={styles.saved}>{message}</p> : null}
    </form>
  );
}
