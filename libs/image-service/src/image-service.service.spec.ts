import { Test, TestingModule } from '@nestjs/testing';
import { ImageServiceService } from './image-service.service';

describe('ImageServiceService', () => {
  let service: ImageServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageServiceService],
    }).compile();

    service = module.get<ImageServiceService>(ImageServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
