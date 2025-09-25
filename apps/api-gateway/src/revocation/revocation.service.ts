/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { CreateRevocationRegistryDto } from '../dtos/create-revocation-registry.dto';
import { UpdateRevocationRegistryUriDto } from '../dtos/update-revocation-registry.dto';
import { BaseService } from 'libs/service/base.service';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RevocationService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly revocationServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('RevocationService');
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  createRevocationRegistry(createRevocationRegistryDto: CreateRevocationRegistryDto, user: any) {
    this.logger.log('**** createRevocationRegistry called');
    const payload = { createRevocationRegistryDto, user };
    return this.natsClient.sendNats(this.revocationServiceProxy, 'create-revocation-registry', payload);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  updateRevocationRegistryUri(updateRevocationRegistryUriDto: UpdateRevocationRegistryUriDto, user: any) {
    this.logger.log('**** updateRevocationRegistryUri called');
    const payload = { updateRevocationRegistryUriDto, user };
    return this.natsClient.sendNats(this.revocationServiceProxy, 'update-revocation-registry-uri', payload);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  activeRevocationRegistry(cred_def_id: string, user: any) {
    this.logger.log('**** activeRevocationRegistry called');
    const payload = { cred_def_id, user };
    return this.natsClient.sendNats(this.revocationServiceProxy, 'active-revocation-registry', payload);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  publishRevocationRegistry(revocationId: string, user: any) {
    this.logger.log('**** publishRevocationRegistry called');
    const payload = { revocationId, user };
    return this.natsClient.sendNats(this.revocationServiceProxy, 'publish-revocation-registry', payload);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  getRevocationRegistry(rev_reg_id: string, user: any) {
    this.logger.log('**** getRevocationRegistry called');
    const payload = { rev_reg_id, user };
    return this.natsClient.sendNats(this.revocationServiceProxy, 'get-revocation-registry', payload);
  }
}
