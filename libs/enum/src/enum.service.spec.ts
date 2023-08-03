import { Test, TestingModule } from '@nestjs/testing';
import { EnumService } from './enum.service';

describe('EnumService', () => {
  let service: EnumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnumService]
    }).compile();

    service = module.get<EnumService>(EnumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
