/**
 * Removed. Demo VOD is not part of the product.
 * Use: node --env-file=.env scripts/purge-demo-vod.mjs
 * Then sync real assets via POST /api/admin/streaming/sync
 */
console.error('seed-demo-vod was retired. Run scripts/purge-demo-vod.mjs instead.');
process.exitCode = 1;
