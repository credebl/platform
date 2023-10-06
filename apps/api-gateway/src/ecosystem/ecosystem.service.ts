import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { GetAllSentEcosystemInvitationsDto } from './dtos/get-all-sent-ecosystemInvitations-dto';
import { BulkEcosystemInvitationDto } from './dtos/send-invitation.dto';
import { AcceptRejectEcosystemInvitationDto } from './dtos/accept-reject-ecosysteminvitation-dto';


@Injectable()
export class EcosystemService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('EcosystemService');
  }

  /**
   *
   * @param createEcosystemDto
   * @returns Ecosystem creation success
   */
  async createEcosystem(createEcosystemDto): Promise<object> {
    const payload = { createEcosystemDto };
    return this.sendNats(this.serviceProxy, 'create-ecosystem', payload);
  }

  /**
   *
   * @param editEcosystemDto
   * @returns Ecosystem creation success
   */
  async editEcosystem(editEcosystemDto, ecosystemId): Promise<object> {
    const payload = { editEcosystemDto, ecosystemId };
    return this.sendNats(this.serviceProxy, 'edit-ecosystem', payload);
  }

  /**
   *
   *
   * @returns Get all ecosystems
   */
  async getAllEcosystem(): Promise<{ response: object }> {
    return this.sendNats(this.serviceProxy, 'get-all-ecosystem', '');
  }
  

  /**
   * 
   * @param bulkInvitationDto 
   * @param userId 
   * @returns 
   */
  async createInvitation(bulkInvitationDto: BulkEcosystemInvitationDto, userId: string): Promise<object> {
      const payload = { bulkInvitationDto, userId };
      return this.sendNats(this.serviceProxy, 'send-ecosystem-invitation', payload);
  }
  

  /**
   *
   * @returns Ecosystem Invitations details
   */
    async getEcosystemInvitations(
      getAllInvitationsDto: GetAllSentEcosystemInvitationsDto,      
      userEmail: string,
      status: string
    ): Promise<{ response: object }> {
      const { pageNumber, pageSize, search } = getAllInvitationsDto;
      const payload = { userEmail, status, pageNumber, pageSize, search };
      return this.sendNats(this.serviceProxy, 'get-ecosystem-invitations', payload);
    }

    async acceptRejectEcosystemInvitaion(
      acceptRejectInvitation: AcceptRejectEcosystemInvitationDto,
      userEmail: string
    ): Promise<{ response: string }> {
      const payload = { acceptRejectInvitation, userEmail };
      return this.sendNats(this.serviceProxy, 'accept-reject-ecosystem-invitations', payload);
    }  
    
}
