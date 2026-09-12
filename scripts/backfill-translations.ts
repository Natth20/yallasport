import { backfillTranslations } from '../src/lib/i18n/backfill';

async function main() {
  const result = await backfillTranslations('system-backfill');
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
