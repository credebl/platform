import { Test, TestingModule } from '@nestjs/testing';
import { LedgerServiceController } from './ledger.controller';
import { LedgerServiceService } from './ledger.service';

describe('LedgerServiceController', () => {
  let ledgerServiceController: LedgerServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LedgerServiceController],
      providers: [LedgerServiceService]
    }).compile();

    ledgerServiceController = app.get<LedgerServiceController>(LedgerServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(ledgerServiceController.getHello()).toBe('Hello World!');
    });
  });
});
