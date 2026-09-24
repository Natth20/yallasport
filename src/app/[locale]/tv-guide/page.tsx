import { sendToYallaLive } from '@/lib/streaming/public-door';

export const dynamic = 'force-dynamic';

export default async function TVGuidePage() {
  await sendToYallaLive();
}
