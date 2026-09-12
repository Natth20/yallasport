'use client';

import { LicensedPlayer } from '@/components/streaming/LicensedPlayer';

/**
 * Direct HLS/DASH player for free/demo VOD when a streamUrl is stored on the episode.
 * Live/licensed match playback still goes through /api/stream/playback + entitlement.
 */
export function VodStreamPlayer({
  manifestUrl,
  protocol = 'HLS',
}: {
  manifestUrl: string;
  protocol?: 'HLS' | 'DASH';
}) {
  return (
    <LicensedPlayer
      manifestUrl={manifestUrl}
      protocol={protocol}
      drmType="NONE"
    />
  );
}
