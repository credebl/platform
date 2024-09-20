import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { LedgerRepository } from './repositories/ledger.repository';
import { RpcException } from '@nestjs/microservices';
// eslint-disable-next-line camelcase
import { ledgers, user_org_roles } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { LedgerDetails } from './interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';

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

    async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {
        try {
            const getNetworkUrl = await this.ledgerRepository.getNetworkUrl(indyNamespace);

            if (!getNetworkUrl) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getNetworkUrl;
        } catch (error) {
            this.logger.error(`Error in retrieving network url: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async getLedgerDetailsById(id: string): Promise<LedgerDetails> {
        try {
            const getAllLedgerDetails = await this.ledgerRepository.getNetworkById(id);

            if (!getAllLedgerDetails) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getAllLedgerDetails;
        } catch (error) {
            this.logger.error(`Error in getLedgerDetailsById: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }


    async schemaDetailsForEcosystem(data): Promise<LedgerDetails> {
        try {
            const getSchemaDetails = await this.ledgerRepository.handleGetSchemas(data);

            if (!getSchemaDetails) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getSchemaDetails;
        } catch (error) {
            this.logger.error(`Error in getLedgerDetailsById: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async getOrgAgentDetailsForEcosystem(data): Promise<LedgerDetails> {
        try {
            const getAllOrganizationDetails = await this.ledgerRepository.handleGetOrganisationData(data);

            if (!getAllOrganizationDetails) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getAllOrganizationDetails;
        } catch (error) {
            this.logger.error(`Error in getLedgerDetailsById: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    // eslint-disable-next-line camelcase
    async getuserOrganizationForEcosystem(data): Promise<user_org_roles[]> {
        try {
            const getOrganizationDetails = await this.ledgerRepository.handleGetUserOrganizations(data);

            if (!getOrganizationDetails) {
                throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
            }

            return getOrganizationDetails;
        } catch (error) {
            this.logger.error(`Error in getLedgerDetailsById: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }
}