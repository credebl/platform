import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { BulkEcosystemInvitationDto } from './dtos/send-invitation.dto';
import { AcceptRejectEcosystemInvitationDto } from './dtos/accept-reject-invitations.dto';
import { GetAllEcosystemInvitationsDto } from './dtos/get-all-sent-invitations.dto';
import { GetAllSentEcosystemInvitationsDto } from './dtos/get-all-received-invitations.dto';
import { GetAllEcosystemMembersDto } from './dtos/get-members.dto';
import { GetAllEndorsementsDto } from './dtos/get-all-endorsements.dto';

import { RequestSchemaDto, RequestCredDefDto } from './dtos/request-schema.dto';
import { CreateEcosystemDto } from './dtos/create-ecosystem-dto';
import { EditEcosystemDto } from './dtos/edit-ecosystem-dto';
import { IEditEcosystem, IEcosystemDashboard, ICreateEcosystem, EcosystemDetailsResult } from 'apps/ecosystem/interfaces/ecosystem.interfaces';

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
  async createEcosystem(createEcosystemDto: CreateEcosystemDto): Promise<ICreateEcosystem> {
    const payload = { createEcosystemDto };
    return this.sendNatsMessage(this.serviceProxy, 'create-ecosystem', payload);
  }

  /**
   *
   * @param editEcosystemDto
   * @returns Ecosystem creation success
   */
  async editEcosystem(editEcosystemDto: EditEcosystemDto, ecosystemId: string): Promise<IEditEcosystem> {
    const payload = { editEcosystemDto, ecosystemId };
    return this.sendNatsMessage(this.serviceProxy, 'edit-ecosystem', payload);
  }

  /**
   *
   *
   * @returns Get all ecosystems
   */
  async getAllEcosystem(orgId: string): Promise<EcosystemDetailsResult> {
    const payload = { orgId };
    return this.sendNatsMessage(this.serviceProxy, 'get-all-ecosystem', payload);
  }

  /**
   *
   *
   * @returns Get ecosystems dashboard card counts
   */
  async getEcosystemDashboardDetails(ecosystemId: string, orgId: string): Promise<IEcosystemDashboard> {
    const payload = { ecosystemId, orgId };
    return this.sendNatsMessage(this.serviceProxy, 'get-ecosystem-dashboard-details', payload);
  }

  /**
   *
   * @param bulkInvitationDto
   * @param userId
   * @returns
   */
  async createInvitation(
    bulkInvitationDto: BulkEcosystemInvitationDto,
    userId: string,
    userEmail: string
  ): Promise<object> {
    const payload = { bulkInvitationDto, userId, userEmail };

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
    const { pageNumber, pageSize, search, sortBy } = getEcosystemMembers;
    const payload = { ecosystemId, pageNumber, pageSize, search, sortBy };
    return this.sendNats(this.serviceProxy, 'fetch-ecosystem-members', payload);
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

  async deleteEcosystemInvitations(invitationId: string): Promise<object> {
    const payload = { invitationId };
    return this.sendNats(this.serviceProxy, 'delete-ecosystem-invitations', payload);
  }
  async acceptRejectEcosystemInvitaion(
    acceptRejectInvitation: AcceptRejectEcosystemInvitationDto,
    userEmail: string
  ): Promise<{ response: string }> {
    const payload = { acceptRejectInvitation, userEmail };
    return this.sendNats(this.serviceProxy, 'accept-reject-ecosystem-invitations', payload);
  }

  async fetchEcosystemOrg(ecosystemId: string, orgId: string): Promise<{ response: object }> {
    const payload = { ecosystemId, orgId };
    return this.sendNats(this.serviceProxy, 'fetch-ecosystem-org-data', payload);
  }

  async getEndorsementTranasactions(
    ecosystemId: string,
    orgId: string,
    getAllEndorsements: GetAllEndorsementsDto
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search, type } = getAllEndorsements;
    const payload = { ecosystemId, orgId, pageNumber, pageSize, search, type };
    return this.sendNats(this.serviceProxy, 'get-endorsement-transactions', payload);
  }

  async getAllEcosystemSchemas(
    ecosystemId: string,
    orgId: string,
    getAllEcosystemSchemaDto: GetAllEcosystemInvitationsDto
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getAllEcosystemSchemaDto;
    const payload = { ecosystemId, orgId, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'get-all-ecosystem-schemas', payload);
  }

  async schemaEndorsementRequest(
    requestSchemaPayload: RequestSchemaDto,
    orgId: string,
    ecosystemId: string
  ): Promise<object> {
    const payload = { requestSchemaPayload, orgId, ecosystemId };
    return this.sendNats(this.serviceProxy, 'schema-endorsement-request', payload);
  }

  async credDefEndorsementRequest(
    requestCredDefPayload: RequestCredDefDto,
    orgId: string,
    ecosystemId: string
  ): Promise<object> {
    const payload = { requestCredDefPayload, orgId, ecosystemId };
    return this.sendNats(this.serviceProxy, 'credDef-endorsement-request', payload);
  }

  async signTransaction(endorsementId: string, ecosystemId: string): Promise<object> {
    const payload = { endorsementId, ecosystemId };
    return this.sendNats(this.serviceProxy, 'sign-endorsement-transaction', payload);
  }

  async submitTransaction(endorsementId: string, ecosystemId: string, orgId: string): Promise<object> {
    const payload = { endorsementId, ecosystemId, orgId };
    return this.sendNats(this.serviceProxy, 'sumbit-endorsement-transaction', payload);
  }

  async autoSignAndSubmitTransaction(): Promise<{ response: object }> {
    const payload = {};
    return this.sendNats(this.serviceProxy, 'auto-endorsement-transaction', payload);
  }

  async declineEndorsementRequestByLead(
    ecosystemId: string,
    endorsementId: string,
    orgId: string
  ): Promise<{ response: object }> {
    const payload = { ecosystemId, endorsementId, orgId };
    return this.sendNats(this.serviceProxy, 'decline-endorsement-transaction', payload);
  }
}
