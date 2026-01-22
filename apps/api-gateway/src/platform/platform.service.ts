import { Injectable, Inject } from '@nestjs/common';
import { BaseService } from '../../../../libs/service/base.service';
import { ILedgers, ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { INetworkUrl, ISchemaDetails } from '@credebl/common/interfaces/schema.interface';
import { GetAllPlatformCredDefsDto } from '../credential-definition/dto/get-all-platform-cred-defs.dto';
import { IPlatformCredDefsData } from '@credebl/common/interfaces/cred-def.interface';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';
import { IEcosystemInvitations } from 'apps/ecosystem/interfaces/ecosystem.interfaces';

@Injectable()
export class PlatformService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly platformServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('PlatformService');
  }

  async getAllSchema(schemaSearchCriteria: ISchemaSearchPayload, user: IUserRequestInterface): Promise<ISchemaDetails> {
    const schemaSearch = { schemaSearchCriteria, user };
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-all-schemas', schemaSearch);
  }

  async getAllPlatformCredDefs(
    getAllPlatformCredDefs: GetAllPlatformCredDefsDto,
    user: IUserRequestInterface
  ): Promise<IPlatformCredDefsData> {
    const credDefs = { ...getAllPlatformCredDefs, user };
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-all-platform-cred-defs', credDefs);
  }

  async getAllLedgers(): Promise<ILedgers[]> {
    const payload = {};
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-all-ledgers', payload);
  }

  async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-network-url', indyNamespace);
  }

  async getShorteningUrlById(referenceId: string): Promise<object> {
    // NATS call
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-shortening-url', referenceId);
  }

  /**
   *  Invites a user to create an ecosystem
   * `@param` email - The email address of the user to invite
   * `@param` platformAdminId - The ID of the platform admin sending the invitation
   * @returns The created ecosystem invitation
   */
  async inviteUserToCreateEcosystem(email: string, platformAdminId: string): Promise<IEcosystemInvitations> {
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'invite-user-for-ecosystem-creation', {
      email,
      platformAdminId
    });
  }
  /**
   *
   * @param userId
   * @returns Get invitations
   */
  async getInvitationsByUserId(userId: string): Promise<IEcosystemInvitations[]> {
    return this.natsClient.sendNatsMessage(this.platformServiceProxy, 'get-ecosystem-invitations-by-user', { userId });
  }
}
