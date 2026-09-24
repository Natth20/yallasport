const key = process.env.RESEND_API_KEY?.trim();
const from = process.env.MAIL_FROM?.trim() || 'Yalla Sport <contact@yallasport.com>';
if (!key) {
  console.log(JSON.stringify({ ok: false, reason: 'missing_key' }));
  process.exit(1);
}

const domains = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${key}` },
});
const domainsBody = await domains.json().catch(() => ({}));
const send = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: ['contact@yallasport.com'],
    subject: 'Yalla Sport · ops alert delivery check',
    text: `Delivery probe ${new Date().toISOString()}\nThis must land in contact@yallasport.com, not only the Resend dashboard.`,
  }),
});
const sendBody = await send.json().catch(() => ({}));
console.log(
  JSON.stringify({
    domainsStatus: domains.status,
    domainsError: domainsBody?.name || domainsBody?.message || null,
    domainsCount: Array.isArray(domainsBody?.data) ? domainsBody.data.length : null,
    domainNames: Array.isArray(domainsBody?.data)
      ? domainsBody.data.map((d) => ({ name: d.name, status: d.status }))
      : null,
    sendStatus: send.status,
    sendId: sendBody?.id || null,
    sendError: sendBody?.name || sendBody?.message || sendBody?.error || null,
  }),
);
