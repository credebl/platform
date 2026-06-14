import { CanActivate, ForbiddenException, Injectable, Scope } from '@nestjs/common';

import { PlatformConfigRepository } from '@credebl/config';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable({ scope: Scope.REQUEST })
export class EcosystemFeatureGuard implements CanActivate {
  constructor(private readonly platformConfigRepository: PlatformConfigRepository) {}

  async canActivate(): Promise<boolean> {
    const config = await this.platformConfigRepository.getPlatformConfig();
    const enabled = Boolean(config?.isEcosystemEnabled);

    if (!enabled) {
      throw new ForbiddenException(ResponseMessages.ecosystem.error.featureIsDisabled);
    }

    return true;
  }
}
