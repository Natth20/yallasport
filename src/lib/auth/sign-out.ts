'use server';

import { signOut } from '@/lib/auth/auth';

export async function signOutAction(formData: FormData) {
  const locale = formData.get('locale') === 'en' ? 'en' : 'ar';
  await signOut({ redirectTo: `/${locale}/login` });
}
