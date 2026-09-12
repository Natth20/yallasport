import 'server-only';

import type { StreamingProvider } from './interface';
import { LicensedStreamingProvider } from './providers/licensed-provider';
import { UnconfiguredStreamingProvider } from './providers/unconfigured-provider';

export const STREAMING_ENABLED = process.env.STREAMING_ENABLED === 'true';

export function getStreamingProvider(): StreamingProvider {
  const key = (process.env.STREAMING_PROVIDER || 'unconfigured').trim().toLowerCase();
  if (!STREAMING_ENABLED) {
    return new UnconfiguredStreamingProvider();
  }
  if (key === 'licensed' || process.env.STREAMING_PLAYBACK_URL) {
    return new LicensedStreamingProvider();
  }
  return new UnconfiguredStreamingProvider();
}
