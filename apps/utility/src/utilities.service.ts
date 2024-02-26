import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import { AwsService } from '@credebl/aws';
// import { IUtilities } from '../interfaces/shortening-url.interface';
import { S3 } from 'aws-sdk';
import { IStoreObject } from '../interfaces/shortening-url.interface';

@Injectable()
export class UtilitiesService {
    constructor(
        private readonly logger: Logger,
        private readonly utilitiesRepository: UtilitiesRepository,
        private readonly awsService: AwsService
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

    async storeObject(payload: {persistent: boolean, storeObj: IStoreObject}): Promise<string> {
        try {
            // eslint-disable-next-line no-console
            console.log('received here. StoreObj::::::', JSON.stringify(payload.storeObj.data));
            const timestamp = Date.now();
            const uploadResult:S3.ManagedUpload.SendData = await this.awsService.storeObject(payload.persistent, timestamp, payload.storeObj.data);
            const url: string = `https://${uploadResult.Bucket}.s3.${process.env.AWS_S3_STOREOBJECT_REGION}.amazonaws.com/${uploadResult.Key}`;
            return url;
            // return 'success';
        } catch (error) {
            Logger.error(error);
            throw new Error('An error occurred while uploading data to S3. Error::::::');
        }
    }
}
