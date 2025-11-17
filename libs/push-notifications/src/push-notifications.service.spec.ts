import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationsService } from './push-notifications.service';

describe('PushNotificationsService', () => {
  let service: PushNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushNotificationsService]
    }).compile();

    service = module.get<PushNotificationsService>(PushNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
