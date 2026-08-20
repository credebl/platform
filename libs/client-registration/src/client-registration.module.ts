import { Module } from '@nestjs/common';
import { ClientRegistrationService } from './client-registration.service';
import { CommonModule } from '@credebl/common';
import { KeycloakUrlModule } from '@credebl/keycloak-url';

@Module({
  imports: [CommonModule, KeycloakUrlModule],
  providers: [ClientRegistrationService],
  exports: [ClientRegistrationService]
})
export class ClientRegistrationModule {}
