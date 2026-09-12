/**
 * Sync licensed catalog.
 * Prefer: authenticated POST /api/admin/streaming/sync
 * Or set STREAMING_CATALOG_URL + STREAMING_API_KEY and call that route.
 *
 * This script only verifies env + fetches payload shape (does not invent data).
 * Usage: node --env-file=.env scripts/sync-licensed-catalog.mjs
 */
async function main() {
  const endpoint = (process.env.STREAMING_CATALOG_URL || '').trim();
  const secret = (process.env.STREAMING_API_KEY || '').trim();

  if (!endpoint || !secret) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: 'missing_env',
          need: ['STREAMING_CATALOG_URL', 'STREAMING_API_KEY', 'STREAMING_ENABLED=true', 'STREAMING_PLAYBACK_URL'],
          ingest: 'POST /api/admin/streaming/sync with the vendor JSON body, or with empty body to pull STREAMING_CATALOG_URL',
          payload: {
            channels: [{ externalId: 'ch-1', name: 'News One', kind: 'NEWS' }],
            shows: [
              {
                externalId: 'show-1',
                title: 'Example',
                slug: 'example',
                type: 'DOCUMENTARY',
                episodes: [{ externalId: 'ep-1', episodeNumber: 1, title: 'Part 1' }],
              },
            ],
            assets: [
              {
                externalAssetId: 'asset-linear-1',
                channelExternalId: 'ch-1',
                status: 'LIVE',
                protocol: 'HLS',
              },
              {
                externalAssetId: 'asset-vod-1',
                episodeExternalId: 'ep-1',
                status: 'READY',
                protocol: 'HLS',
              },
            ],
          },
        },
        null,
        2
      )
    );
    return;
  }

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
  });
  const text = await response.text();
  console.log(
    JSON.stringify(
      {
        ok: response.ok,
        status: response.status,
        bytes: text.length,
        next: 'POST the JSON to /api/admin/streaming/sync while signed in as admin',
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
