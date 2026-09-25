import webPush from 'web-push';

let configured = false;

function configureWebPush() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: {
    title: string;
    body: string;
    url: string;
    tag?: string;
    icon?: string;
  }
) {
  if (!configureWebPush()) throw new Error('VAPID keys are not configured');

  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  );
}
