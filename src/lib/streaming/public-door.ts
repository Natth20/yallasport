import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { STREAMING_ENABLED } from './flag';

/** Public watch/VOD indexes stay closed until a licensed contract is on. */
export async function requireLicensedStreaming() {
  if (STREAMING_ENABLED) return;
  await sendToYallaLive();
}

/** Merged public door: listings live on /live only. */
export async function sendToYallaLive() {
  const locale = await getLocale();
  redirect(`/${locale}/live`);
}
