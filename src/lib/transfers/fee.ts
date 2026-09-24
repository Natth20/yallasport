export type TransferKind = 'loan' | 'free' | 'move';

export function splitTransferType(raw?: string | null): {
  type: string | null;
  fee: string | null;
  kind: TransferKind;
} {
  const value = (raw || '').trim();
  if (!value || value === '-' || /^n\/?a$/i.test(value)) {
    return { type: null, fee: null, kind: 'move' };
  }
  const money = /(?:€|£|\$)\s*\d[\d.,]*\s*[kmb]?|\d[\d.,]*\s*(?:k|m|bn|million|mille)/i.test(value)
    ? value.replace(/^(loan|free|transfer)[:\s-]*/i, '').trim()
    : null;
  if (/loan/i.test(value)) return { type: 'Loan', fee: money && /loan/i.test(money) ? null : money, kind: 'loan' };
  if (/free/i.test(value)) return { type: 'Free', fee: null, kind: 'free' };
  if (money) return { type: 'Transfer', fee: money, kind: 'move' };
  return { type: value, fee: null, kind: 'move' };
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
