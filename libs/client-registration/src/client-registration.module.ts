import { Module } from '@nestjs/common';
import { ClientRegistrationService } from './client-registration.service';

@Module({
  providers: [ClientRegistrationService],
  exports: [ClientRegistrationService]
})
export class ClientRegistrationModule {}
