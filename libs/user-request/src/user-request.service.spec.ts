import { Test, TestingModule } from '@nestjs/testing';
import { UserRequestService } from './user-request.service';

describe('UserRequestService', () => {
  let service: UserRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRequestService]
    }).compile();

    service = module.get<UserRequestService>(UserRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
