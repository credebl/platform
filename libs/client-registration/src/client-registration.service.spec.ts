import { Test, TestingModule } from '@nestjs/testing';
import { ClientRegistrationService } from './client-registration.service';

describe('ClientRegistrationService', () => {
  let service: ClientRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientRegistrationService]
    }).compile();

    service = module.get<ClientRegistrationService>(ClientRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
