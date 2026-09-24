export function gaMeasurementId() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || '';
  return /^G-[A-Z0-9]+$/i.test(id) ? id : '';
}

export function googleSiteVerification() {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || '';
}
