import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ar = JSON.parse(readFileSync(join(root, 'src/lib/i18n/dictionaries/ar.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/lib/i18n/dictionaries/en.json'), 'utf8'));

function keys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

const arKeys = keys(ar).sort();
const enKeys = keys(en).sort();
const missingEn = arKeys.filter((key) => !enKeys.includes(key));
const missingAr = enKeys.filter((key) => !arKeys.includes(key));
const arabicInEn = JSON.stringify(en).match(/[\u0600-\u06FF]/);

if (missingEn.length || missingAr.length || arabicInEn) {
  console.error('i18n dictionary check failed');
  if (missingEn.length) console.error('Missing in EN:', missingEn.join(', '));
  if (missingAr.length) console.error('Missing in AR:', missingAr.join(', '));
  if (arabicInEn) console.error('Arabic characters found in en.json');
  process.exit(1);
}

console.log(`i18n dictionaries OK (${arKeys.length} keys)`);
