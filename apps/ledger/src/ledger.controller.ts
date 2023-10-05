import { Controller } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { MessagePattern } from '@nestjs/microservices';
import { ledgers } from '@prisma/client';

@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) { }

  @MessagePattern({ cmd: 'get-all-ledgers' })
  async getAllLedgers(): Promise<ledgers[]> {
    return this.ledgerService.getAllLedgers();
  }
}
