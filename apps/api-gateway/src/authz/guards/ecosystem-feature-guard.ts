import { CanActivate, ForbiddenException, Injectable, Scope } from '@nestjs/common';

import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable({ scope: Scope.REQUEST })
export class EcosystemFeatureGuard implements CanActivate {
  constructor(private readonly ecosystemRepository: EcosystemRepository) {}

  async canActivate(): Promise<boolean> {
    const config = await this.ecosystemRepository.getPlatformConfig();
    const enabled = Boolean(config?.isEcosystemEnabled);

    if (!enabled) {
      throw new ForbiddenException(ResponseMessages.ecosystem.error.featureIsDisabled);
    }

    return true;
  }
}
