import type { StreamingProvider } from '../interface';

export class UnconfiguredStreamingProvider implements StreamingProvider {
  readonly key = 'unconfigured';

  async mintPlayback(_input: {
    externalAssetId: string;
    credentialsRef: string | null;
    protocol: 'HLS' | 'DASH';
    drmType: 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';
    userId: string;
  }): Promise<null> {
    return null;
  }
}
