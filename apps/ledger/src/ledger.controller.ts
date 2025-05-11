import { Controller } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { MessagePattern } from '@nestjs/microservices';
import { ledgers } from '@prisma/client';
import { LedgerDetails } from './interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';
import { ISchemasList } from './schema/interfaces/schema.interface';

@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) { }

  @MessagePattern({ cmd: 'get-all-ledgers' })
  async getAllLedgers(): Promise<ledgers[]> {
    return this.ledgerService.getAllLedgers();
  }

  @MessagePattern({ cmd: 'get-network-url' })
  async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {
    return this.ledgerService.getNetworkUrl(indyNamespace);
  }

  @MessagePattern({ cmd: 'get-network-details-by-id' })
  async getNetworkDetailsById(payload: {id: string}): Promise<LedgerDetails> {
    return this.ledgerService.getLedgerDetailsById(payload.id);
  }

  @MessagePattern({ cmd: 'get-schema-details-for-ecosystem' })
  async schemaDetailsForEcosystem(payload: {schemaArray: string[], search: string, pageSize: number, pageNumber: number}): Promise<ISchemasList> {
    return this.ledgerService.schemaDetailsForEcosystem(payload);
  }
}