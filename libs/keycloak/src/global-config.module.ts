import { Module } from '@nestjs/common';
import { GlobalConfigModule } from '@credebl/common';
import { KeycloakUrlService } from './keycloak-url.service';
import { ClientRegistrationService } from './client-registration.service';
import { KeycloakConfigService } from './keycloak-config.service';

@Module({
  imports: [GlobalConfigModule],
  providers: [KeycloakUrlService, ClientRegistrationService, KeycloakConfigService],
  exports: [KeycloakUrlService, ClientRegistrationService, KeycloakConfigService]
})
export class KeycloakModule {}
