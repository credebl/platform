import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { GetAllSentEcosystemInvitationsDto } from './dtos/get-all-sent-ecosystemInvitations-dto';
import { GetAllEndorsementsDto } from './dtos/get-all-endorsements.dto';

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
  async getAllEcosystem(orgId: string): Promise<{ response: object }> {
    const payload = { orgId };
    return this.sendNats(this.serviceProxy, 'get-all-ecosystem', payload);
  }
  
  /**
   *
   *
   * @returns Get ecosystems dashboard card counts
   */
  async getEcosystemDashboardDetails(ecosystemId: string, orgId: string): Promise<{ response: object }> {
    const payload = { ecosystemId, orgId };
    return this.sendNats(this.serviceProxy, 'get-ecosystem-dashboard-details', payload);
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

  async getInvitationsByEcosystemId(
    ecosystemId: string,
    getAllInvitationsDto: GetAllEcosystemInvitationsDto,
    userId: string
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getAllInvitationsDto;
    const payload = { ecosystemId, pageNumber, pageSize, search, userId };
    return this.sendNats(this.serviceProxy, 'get-sent-invitations-ecosystemId', payload);
  }
  
/**
   *
   * @returns Ecosystem members
   */
  async getEcosystemMembers(
    ecosystemId: string,
    getEcosystemMembers: GetAllEcosystemMembersDto
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getEcosystemMembers;
    const payload = { ecosystemId, pageNumber, pageSize, search};
    return this.sendNats(this.serviceProxy, 'fetch-ecosystem-members', payload);
  }  

}
