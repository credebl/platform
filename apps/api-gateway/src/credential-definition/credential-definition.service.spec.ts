import { Test, TestingModule } from '@nestjs/testing';
import { CredentialDefinitionService } from './credential-definition.service';

describe('CredentialDefinitionService', () => {
  let service: CredentialDefinitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CredentialDefinitionService]
    }).compile();

    service = module.get<CredentialDefinitionService>(CredentialDefinitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
