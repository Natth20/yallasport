export const REPORT_KINDS = [
  { id: 'data', ar: 'خطأ في نتيجة أو جدول', en: 'Score or table error' },
  { id: 'news', ar: 'خبر غير دقيق أو بلا مصدر', en: 'Inaccurate or unsourced news' },
  { id: 'rights', ar: 'حقوق نشر أو علامة تجارية', en: 'Copyright or trademark' },
  { id: 'abuse', ar: 'تعليق مسيء أو تحريض', en: 'Abusive comment' },
  { id: 'stream', ar: 'بث يظهر بلا ترخيص', en: 'Unlicensed stream shown' },
  { id: 'privacy', ar: 'خصوصية أو حساب', en: 'Privacy or account' },
  { id: 'tech', ar: 'خلل تقني في الصفحة', en: 'Technical fault' },
] as const;

export const CONTACT_KINDS = [
  { id: 'enquiry', ar: 'استفسار عام', en: 'General enquiry' },
  { id: 'privacy', ar: 'خصوصية', en: 'Privacy' },
  { id: 'rights', ar: 'حقوق نشر', en: 'Copyright' },
  { id: 'press', ar: 'صحافة أو شراكة', en: 'Press or partnership' },
  { id: 'other', ar: 'موضوع آخر', en: 'Other' },
] as const;

export type DeskChannelId = 'report' | 'contact';

export function kindsFor(channel: DeskChannelId) {
  return channel === 'contact' ? CONTACT_KINDS : REPORT_KINDS;
}

export function kindLabel(channel: DeskChannelId, kind: string, locale: string) {
  const row = kindsFor(channel).find((item) => item.id === kind);
  if (!row) return kind;
  return locale === 'ar' ? row.ar : row.en;
}

export function isKnownKind(channel: DeskChannelId, kind: unknown): kind is string {
  return typeof kind === 'string' && kindsFor(channel).some((item) => item.id === kind);
}
