import { Test, TestingModule } from '@nestjs/testing';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';

describe('EcosystemController', () => {
  let ecosystemController: EcosystemController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EcosystemController],
      providers: [EcosystemService]
    }).compile();

    ecosystemController = app.get<EcosystemController>(EcosystemController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(ecosystemController.getHello()).toBe('Hello World!');
    });
  });
});
