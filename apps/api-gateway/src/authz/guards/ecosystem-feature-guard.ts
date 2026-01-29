import { CanActivate, ForbiddenException, Injectable, Scope } from '@nestjs/common';

import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';

@Injectable({ scope: Scope.REQUEST })
export class EcosystemFeatureGuard implements CanActivate {
  constructor(private readonly ecosystemRepository: EcosystemRepository) {}

  async canActivate(): Promise<boolean> {
    const config = await this.ecosystemRepository.getPlatformConfig();
    const enabled = Boolean(config?.isEcosystemEnabled);

    if (!enabled) {
      throw new ForbiddenException(`You don't have access to this feature`);
    }

    return true;
  }
}
