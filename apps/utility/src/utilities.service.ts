import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import { StorageService } from '@credebl/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UtilitiesService {
  constructor(
    private readonly logger: Logger,
    private readonly utilitiesRepository: UtilitiesRepository,
    private readonly storageService: StorageService
  ) {}

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

      const getInvitationUrl = {
        referenceId: getShorteningUrl.referenceId,
        invitationPayload: getShorteningUrl.invitationPayload
      };

      return getInvitationUrl;
    } catch (error) {
      this.logger.error(`[getShorteningUrl] - error in get shortening url: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async storeObject(payload: { persistent: boolean; storeObj: unknown }): Promise<string> {
    try {
      const uuid = uuidv4();
      this.logger.log(`In storeObject in utilityService`);
      const uploadResult: string = await this.storageService.storeObject(payload.persistent, uuid, payload.storeObj);
      return uploadResult;
    } catch (error) {
      this.logger.error(error);
      throw new Error('An error occurred while uploading data Error::::::');
    }
  }
}
