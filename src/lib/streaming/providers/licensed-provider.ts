import type { PlaybackSession, StreamingProvider } from '../interface';

/**
 * Plug the licensed vendor here when the API arrives.
 * Set STREAMING_ENABLED=true, STREAMING_PROVIDER=licensed,
 * STREAMING_PLAYBACK_URL and STREAMING_API_KEY.
 * Adjust the request/response mapping to match the vendor contract.
 * Until those values exist, mintPlayback returns null and the UI stays honest.
 */
export class LicensedStreamingProvider implements StreamingProvider {
  readonly key = 'licensed';

  async mintPlayback(input: {
    externalAssetId: string;
    credentialsRef: string | null;
    protocol: PlaybackSession['protocol'];
    drmType: PlaybackSession['drmType'];
    userId: string;
  }): Promise<PlaybackSession | null> {
    const endpoint = (process.env.STREAMING_PLAYBACK_URL || '').trim();
    const secret = (process.env.STREAMING_API_KEY || '').trim();
    if (!endpoint || !secret) return null;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetId: input.externalAssetId,
        credentialsRef: input.credentialsRef,
        protocol: input.protocol,
        drmType: input.drmType,
        userId: input.userId,
      }),
    }).catch(() => null);

    if (!response?.ok) return null;
    const data = await response.json().catch(() => null) as {
      manifestUrl?: string;
      licenseUrl?: string | null;
      protocol?: PlaybackSession['protocol'];
      drmType?: PlaybackSession['drmType'];
      expiresAt?: string;
    } | null;
    if (!data?.manifestUrl) return null;

    return {
      assetId: input.externalAssetId,
      protocol: data.protocol === 'DASH' || data.protocol === 'HLS' ? data.protocol : input.protocol,
      drmType: data.drmType ?? input.drmType,
      manifestUrl: data.manifestUrl,
      licenseUrl: data.licenseUrl ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 6 * 60 * 60 * 1000),
    };
  }
}
