import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { LedgerRepository } from './repositories/ledger.repository';
import { RpcException } from '@nestjs/microservices';
import { ledgers } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class LedgerService extends BaseService {

    constructor(
        private readonly ledgerRepository: LedgerRepository
    ) {
        super('LedgerService');
    }

    async getAllLedgers(): Promise<ledgers[]> {
        try {
            const getAllLedgerDetails = await this.ledgerRepository.getAllLedgers();

            if (!getAllLedgerDetails) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getAllLedgerDetails;
        } catch (error) {
            this.logger.error(`Error in retrieving all ledgers: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }
}
