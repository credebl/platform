import { Module } from '@nestjs/common';
import { KeycloakConfigService } from './keycloak-config.service';
import { CommonModule } from '@credebl/common';
import { KeycloakUrlModule } from '@credebl/keycloak-url';
import { ClientRegistrationModule } from '@credebl/client-registration';

@Module({
  imports: [CommonModule, KeycloakUrlModule, ClientRegistrationModule],
  providers: [KeycloakConfigService],
  exports: [KeycloakConfigService]
})
export class KeycloakConfigModule {}
