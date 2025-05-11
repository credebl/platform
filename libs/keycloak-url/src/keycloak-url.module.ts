import { Module } from '@nestjs/common';
import { KeycloakUrlService } from './keycloak-url.service';

@Module({
  providers: [KeycloakUrlService],
  exports: [KeycloakUrlService]
})
export class KeycloakUrlModule {}
