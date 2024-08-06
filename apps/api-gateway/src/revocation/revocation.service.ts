import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// import { CreateRevocationRegistryDto } from '../dtos/create-revocation-registry.dto';
// import { UpdateRevocationRegistryUriDto } from '../dtos/update-revocation-registry.dto';
import { BaseService } from 'libs/service/base.service';
import { NATSClient } from 'libs/common/NATSClient';


@Injectable()
export class RevocationService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly revocationServiceProxy: ClientProxy,
        private natsClient : NATSClient) { 
        super('RevocationService');
    }   

    // createRevocationRegistry(createRevocationRegistryDto: CreateRevocationRegistryDto, user: any) : Promise<any> {
    //     this.logger.log('**** createRevocationRegistryDto called');       
    //     const payload = { createRevocationRegistryDto, user };
    //     return this.natsClient.sendNats(this.revocationServiceProxy, 'create-revocation-registry', payload); 
    // }

    // updateRevocationRegistryUri(updateRevocationRegistryUriDto: UpdateRevocationRegistryUriDto, user: any) : Promise<any> {
    //     this.logger.log('**** updateRevocationRegistryUri called');        
    //     const payload = { updateRevocationRegistryUriDto, user };
    //     return this.natsClient.sendNats(this.revocationServiceProxy, 'update-revocation-registry-uri', payload); 
    // }

    // activeRevocationRegistry(credDefId: string, user: any) : Promise<any> {
    //     this.logger.log('**** activeRevocationRegistry called');        
    //     const payload = { credDefId, user };
    //     return this.natsClient.sendNats(this.revocationServiceProxy, 'active-revocation-registry', payload); 
    // }

    // publishRevocationRegistry(revocationId: string, user: any) : Promise<any> {
    //     this.logger.log('**** publishRevocationRegistry called');       
    //     const payload = { revocationId, user };
    //     return this.natsClient.sendNats(this.revocationServiceProxy, 'publish-revocation-registry', payload);       
    // }

    // getRevocationRegistry(revRegId: string, user: any) : Promise<any> {
    //     this.logger.log('**** getRevocationRegistry called');      
    //     const payload = { revRegId, user };
    //     return this.natsClient.sendNats(this.revocationServiceProxy, 'get-revocation-registry', payload); 
    // }
}