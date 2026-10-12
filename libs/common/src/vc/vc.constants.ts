export const VC_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1';
export const VC_CONTEXT_V2 = 'https://www.w3.org/ns/credentials/v2';

export const SUPPORTED_VC_VERSIONS = ['v1', 'v1.1', 'v2'] as const;
export type VCVersion = typeof SUPPORTED_VC_VERSIONS[number];

export const DEFAULT_VC_VERSION: VCVersion = 'v1.1';
