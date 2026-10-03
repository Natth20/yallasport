export type TransferKind = 'loan' | 'free' | 'move' | 'ended' | 'retired' | 'rumour' | 'unknown';

function isZeroFee(value: string) {
  return /^[€£$]?\s*0([.,]0+)?\s*[kmb]?$/i.test(value.replace(/\s+/g, ''));
}

export function splitTransferType(raw?: string | null): {
  type: string | null;
  fee: string | null;
  kind: TransferKind;
} {
  const value = (raw || '').trim();
  if (!value || value === '-' || /^n\/?a$/i.test(value) || /^unknown$/i.test(value)) {
    return { type: null, fee: null, kind: 'unknown' };
  }
  const moneyMatch = /(?:€|£|\$)\s*\d[\d.,]*\s*[kmb]?|\d[\d.,]*\s*(?:k|m|bn|million|mille)/i.test(value)
    ? value.replace(/^(loan|free|transfer)[:\s-]*/i, '').trim()
    : null;
  const money = moneyMatch && !isZeroFee(moneyMatch) ? moneyMatch : null;
  if (/end of loan|back from loan|return from loan|عودة من الإعارة/i.test(value)) {
    return { type: 'Return from loan', fee: null, kind: 'move' };
  }
  if (/rumour|rumor|unconfirmed|إشاعة|غير مؤكد/i.test(value)) {
    return { type: 'Unconfirmed', fee: null, kind: 'rumour' };
  }
  if (/loan|إعارة/i.test(value)) return { type: 'Loan', fee: money, kind: 'loan' };
  if (/retir/i.test(value)) return { type: 'Retired', fee: null, kind: 'retired' };
  if (/contract ended|released|انتهاء العقد/i.test(value)) {
    return { type: 'Contract ended', fee: null, kind: 'ended' };
  }
  if (/free|انتقال حر/i.test(value)) return { type: 'Free', fee: null, kind: 'free' };
  if (money) return { type: 'Transfer', fee: money, kind: 'move' };
  if (/transfer|انتقال/i.test(value)) return { type: 'Transfer', fee: null, kind: 'move' };
  return { type: value, fee: null, kind: 'unknown' };
}

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  loan: { ar: 'إعارة', en: 'Loan' },
  free: { ar: 'انتقال حر', en: 'Free' },
  move: { ar: 'رسمي', en: 'Official' },
  rumour: { ar: 'غير مؤكد', en: 'Unconfirmed' },
  ended: { ar: 'انتهاء العقد', en: 'Contract ended' },
  retired: { ar: 'اعتزال', en: 'Retired' },
  unknown: { ar: 'غير محدد', en: 'Unknown' },
  'return from loan': { ar: 'عودة من الإعارة', en: 'Return from loan' },
  transfer: { ar: 'انتقال', en: 'Transfer' },
};

export function localizeTransferType(locale: string, raw?: string | null, kind?: TransferKind) {
  const parsed = splitTransferType(raw);
  const resolved = kind || parsed.kind;
  const key = (parsed.type || resolved || 'unknown').toLowerCase();
  const mapped = TYPE_LABEL[key] || TYPE_LABEL[resolved] || TYPE_LABEL.unknown;
  if (!parsed.type && resolved === 'unknown') return locale === 'ar' ? mapped.ar : mapped.en;
  return locale === 'ar' ? mapped.ar : mapped.en;
}

export function footballSeasonLabel(date: Date) {
  if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return null;
  const year = date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${year}/${String(year + 1).slice(-2)}`;
}

export function ageFromBirthDate(birth: Date, now = new Date()) {
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 80 ? age : null;
}

export function feeToNumber(raw?: string | null): number | null {
  if (!raw) return null;
  const text = raw.replace(/\s+/g, '').toLowerCase();
  const match = text.match(/([\d]+(?:[.,]\d+)?)\s*(k|m|bn|b)?/);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  const unit = match[2];
  if (unit === 'k') return amount * 1_000;
  if (unit === 'm') return amount * 1_000_000;
  if (unit === 'bn' || unit === 'b') return amount * 1_000_000_000;
  return amount;
}

export function mercatoWindow(date: Date): 'summer' | 'winter' | 'other' {
  const month = date.getUTCMonth();
  if (month === 5 || month === 6 || month === 7 || month === 8) return 'summer';
  if (month === 0 || month === 1) return 'winter';
  return 'other';
}
