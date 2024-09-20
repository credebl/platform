import { Controller } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { MessagePattern } from '@nestjs/microservices';
import { ledgers } from '@prisma/client';
import { LedgerDetails } from './interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async schemaDetailsForEcosystem(payload): Promise<any> {
    return this.ledgerService.schemaDetailsForEcosystem(payload);
  }

  @MessagePattern({ cmd: 'get-org-agents-and-user-roles' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOrgAgentDetailsForEcosystem(payload): Promise<any> {
    return this.ledgerService.getOrgAgentDetailsForEcosystem(payload);
  }

  @MessagePattern({ cmd: 'get-user-organizations' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getuserOrganizationForEcosystem(payload): Promise<any> {
    return this.ledgerService.getuserOrganizationForEcosystem(payload);
  }
}