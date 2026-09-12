export type StreamProtocolKind = 'HLS' | 'DASH';
export type StreamDrmKind = 'NONE' | 'WIDEVINE' | 'FAIRPLAY' | 'PLAYREADY';
export type StreamAssetLifecycle =
  | 'DRAFT'
  | 'READY'
  | 'LIVE'
  | 'ENDED'
  | 'DISABLED';

export interface PlaybackSession {
  assetId: string;
  protocol: StreamProtocolKind;
  drmType: StreamDrmKind;
  manifestUrl: string;
  licenseUrl?: string | null;
  expiresAt: Date;
}

export interface StreamingProvider {
  readonly key: string;
  mintPlayback(input: {
    externalAssetId: string;
    credentialsRef: string | null;
    protocol: StreamProtocolKind;
    drmType: StreamDrmKind;
    userId: string;
  }): Promise<PlaybackSession | null>;
}
