import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';

@Injectable()
export class UtilitiesService {
    constructor(
        private readonly logger: Logger,
        private readonly utilitiesRepository: UtilitiesRepository
    ) { }

    async createAndStoreShorteningUrl(payload): Promise<string> {
        try {
            const { credentialId, schemaId, credDefId, invitationUrl, attributes } = payload;
            const invitationPayload = {
                referenceId: credentialId,
                invitationPayload: {
                    schemaId, 
                    credDefId,
                    invitationUrl, 
                    attributes
                }
            };
            await this.utilitiesRepository.saveShorteningUrl(invitationPayload);
            return `${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/invitation/qr-code/${credentialId}`;
        } catch (error) {
            this.logger.error(`[createAndStoreShorteningUrl] - error in create shortening url: ${JSON.stringify(error)}`);
            throw new RpcException(error);
        }
    }

    async getShorteningUrl(referenceId: string): Promise<object> {
        try {
            const getShorteningUrl = await this.utilitiesRepository.getShorteningUrl(referenceId);

            const getInvitationUrl  = {
                referenceId: getShorteningUrl.referenceId,
                invitationPayload: getShorteningUrl.invitationPayload
            };
            
            return getInvitationUrl;
        } catch (error) {
            this.logger.error(`[getShorteningUrl] - error in get shortening url: ${JSON.stringify(error)}`);
            throw new RpcException(error);
        }
    }
}
