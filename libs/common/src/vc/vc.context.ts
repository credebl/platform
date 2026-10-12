import { VC_CONTEXT_V1, VC_CONTEXT_V2, VCVersion } from './vc.constants';

export class VCContext {
  static getBaseContext(version: VCVersion): string {
    if (version === 'v2') {
      return VC_CONTEXT_V2;
    }
    return VC_CONTEXT_V1;
  }

  static isV2Context(context: string | string[] | undefined): boolean {
    if (!context) return false;
    const contexts = Array.isArray(context) ? context : [context];
    return contexts.includes(VC_CONTEXT_V2);
  }

  static detectVersionFromContext(context: string | string[] | undefined): VCVersion {
    if (this.isV2Context(context)) {
      return 'v2';
    }
    return 'v1.1';
  }
}
