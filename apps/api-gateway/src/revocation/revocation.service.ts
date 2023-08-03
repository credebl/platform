import { Injectable, Inject, Logger, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateRevocationRegistryDto } from '../dtos/create-revocation-registry.dto';
import { map } from 'rxjs/operators';
import { UpdateRevocationRegistryUriDto } from '../dtos/update-revocation-registry.dto';
import { BaseService } from 'libs/service/base.service';


@Injectable()
export class RevocationService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly revocationServiceProxy: ClientProxy
    ) { 
        super('RevocationService');
    }   

    createRevocationRegistry(createRevocationRegistryDto: CreateRevocationRegistryDto, user: any) {
        this.logger.log('**** createRevocationRegistryDto called');       
        const payload = { createRevocationRegistryDto, user };
        return this.sendNats(this.revocationServiceProxy, 'create-revocation-registry', payload); 
    }

    updateRevocationRegistryUri(updateRevocationRegistryUriDto: UpdateRevocationRegistryUriDto, user: any) {
        this.logger.log('**** updateRevocationRegistryUri called');        
        const payload = { updateRevocationRegistryUriDto, user };
        return this.sendNats(this.revocationServiceProxy, 'update-revocation-registry-uri', payload); 
    }

    activeRevocationRegistry(cred_def_id: string, user: any) {
        this.logger.log('**** activeRevocationRegistry called');        
        const payload = { cred_def_id, user };
        return this.sendNats(this.revocationServiceProxy, 'active-revocation-registry', payload); 
    }

    publishRevocationRegistry(revocationId: string, user: any) {
        this.logger.log('**** publishRevocationRegistry called');       
        const payload = { revocationId, user };
        return this.sendNats(this.revocationServiceProxy, 'publish-revocation-registry', payload);       
    }

    getRevocationRegistry(rev_reg_id: string, user: any) {
        this.logger.log('**** getRevocationRegistry called');      
        const payload = { rev_reg_id, user };
        return this.sendNats(this.revocationServiceProxy, 'get-revocation-registry', payload); 
    }
}