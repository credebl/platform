import { Controller } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { MessagePattern } from '@nestjs/microservices';
import { ledgers } from '@prisma/client';
import { LedgerDetails } from './interfaces/ledgers.interface';

@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) { }

  @MessagePattern({ cmd: 'get-all-ledgers' })
  async getAllLedgers(): Promise<ledgers[]> {
    return this.ledgerService.getAllLedgers();
  }

  @MessagePattern({ cmd: 'get-network-url' })
  async getNetworkUrl(payload: object): Promise<{
    networkUrl: string;
  }> {
    return this.ledgerService.getNetworkUrl(payload);
  }

  @MessagePattern({ cmd: 'get-network-details-by-id' })
  async getNetworkDetailsById(payload: {id: string}): Promise<LedgerDetails> {
    return this.ledgerService.getLedgerDetailsById(payload.id);
  }
}
