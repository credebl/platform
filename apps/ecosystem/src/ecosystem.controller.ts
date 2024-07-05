import { Controller, Logger, Body } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EcosystemService } from './ecosystem.service';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { AcceptRejectEcosystemInvitationDto } from '../dtos/accept-reject-ecosysteminvitation.dto';
import { FetchInvitationsPayload } from '../interfaces/invitations.interface';
import { EcosystemMembersPayload } from '../interfaces/ecosystemMembers.interface';
import { GetEndorsementsPayload, ISchemasResponse } from '../interfaces/endorsements.interface';
import { IEcosystemDashboard, RequestCredDeffEndorsement, IEcosystem, IEcosystemInvitation, IEcosystemInvitations, IEditEcosystem, IEndorsementTransaction, IEcosystemList, IEcosystemLeadOrgs, IRequestSchemaEndorsement } from '../interfaces/ecosystem.interfaces';
import { IEcosystemDataDeletionResults, IEcosystemDetails } from '@credebl/common/interfaces/ecosystem.interface';
import { user } from '@prisma/client';
import { IUserRequestInterface } from 'apps/ledger/src/credential-definition/interfaces';
// eslint-disable-next-line camelcase

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}
  private readonly logger = new Logger('EcosystemController');

  /**
   * Description: create new ecosystem
   * @param payload Registration Details
   * @returns Get created ecosystem details
   */

  @MessagePattern({ cmd: 'create-ecosystem' })
  async createEcosystem(@Body() payload: { createEcosystemDto }): Promise<IEcosystem> {
    return this.ecosystemService.createEcosystem(payload.createEcosystemDto);
  }

  /**
   * Description: edit ecosystem
   * @param payload updation Details
   * @returns Get updated ecosystem details
   */
  @MessagePattern({ cmd: 'edit-ecosystem' })
  async editEcosystem(@Body() payload: { editEcosystemDto; ecosystemId }): Promise<IEditEcosystem> {
    return this.ecosystemService.editEcosystem(payload.editEcosystemDto, payload.ecosystemId);
  }

  /**
   * Description: get all ecosystems
   * @param payload Registration Details
   * @returns Get all ecosystem details
   */
  @MessagePattern({ cmd: 'get-all-ecosystem' })
  async getAllEcosystems(@Body() payload: IEcosystemList): Promise<IEcosystemDetails> {
    return this.ecosystemService.getAllEcosystem(payload);
  }

  /**
   * Description: get ecosystems dashboard details
   * @returns Get ecosystem dashboard details
   */
  @MessagePattern({ cmd: 'get-ecosystem-dashboard-details' })
  async getEcosystemDashboardDetails(payload: { ecosystemId: string; orgId: string }): Promise<IEcosystemDashboard> {
    return this.ecosystemService.getEcosystemDashboardDetails(payload.ecosystemId);
  }

  /**
   * Description: get ecosystem invitations
   * @returns Get sent invitation details
   */
  @MessagePattern({ cmd: 'get-ecosystem-invitations' })
  async getEcosystemInvitations(
    @Body() payload: { userEmail: string; status: string; pageNumber: number; pageSize: number; search: string }
  ): Promise<IEcosystemInvitation> {
    return this.ecosystemService.getEcosystemInvitations(
      payload.userEmail,
      payload.status,
      payload.pageNumber,
      payload.pageSize,
      payload.search
    );
  }

  /**
   *
   * @param payload
   * @returns ecosystem members list
   */
  @MessagePattern({ cmd: 'fetch-ecosystem-members' })
  async getEcosystemMembers(@Body() payload: EcosystemMembersPayload): Promise<object> {
    return this.ecosystemService.getEcosystemMembers(payload);
  }

  /**
   *
   * @param payload
   * @returns Sent ecosystem invitations status
   */
  @MessagePattern({ cmd: 'send-ecosystem-invitation' })
  async createInvitation(payload: {
    bulkInvitationDto: BulkSendInvitationDto;
    userId: string;
    userEmail: string;
    orgId: string;
  }): Promise<IEcosystemInvitations[]> {
    return this.ecosystemService.createInvitation(payload.bulkInvitationDto, payload.userId, payload.userEmail, payload.orgId);
  }


  /**
   *
   * @param orgId
   * @param ecosystemId
   */
    @MessagePattern({ cmd: 'add-organization-in-ecosystem' })
    async addOrganizationsInEcosystem(
      ecosystemLeadOrgs: IEcosystemLeadOrgs
    ): Promise<{ results: { statusCode: number, message: string, error?: string, data?: { orgId: string } }[], statusCode: number, message: string }> {
      return this.ecosystemService.addOrganizationsInEcosystem(ecosystemLeadOrgs);
    }
   
  /**
   *
   * @param payload
   * @returns Ecosystem invitation status fetch-ecosystem-users
   */
  @MessagePattern({ cmd: 'accept-reject-ecosystem-invitations' })
  async acceptRejectEcosystemInvitations(payload: {
    acceptRejectInvitation: AcceptRejectEcosystemInvitationDto,
    userEmail: string
  }): Promise<string> {
    return this.ecosystemService.acceptRejectEcosystemInvitations(payload.acceptRejectInvitation, payload.userEmail);
  }

  @MessagePattern({ cmd: 'get-ecosystem-records' })
  async getEcosystemsByOrgId(payload: { orgId: string, userId: string }): Promise<number> {
    const { orgId } = payload;
    return this.ecosystemService.getEcosystems(orgId);
  }

  @MessagePattern({ cmd: 'get-sent-invitations-ecosystemId' })
  async getInvitationsByOrgId(@Body() payload: FetchInvitationsPayload): Promise<IEcosystemInvitation> {
    return this.ecosystemService.getInvitationsByEcosystemId(payload);
  }

  @MessagePattern({ cmd: 'get-endorsement-transactions' })
  async getEndorsementTransactions(@Body() payload: GetEndorsementsPayload): Promise<object> {
    return this.ecosystemService.getEndorsementTransactions(payload);
  }

  @MessagePattern({ cmd: 'get-all-ecosystem-schemas' })
  async getAllEcosystemSchemas(@Body() payload: GetEndorsementsPayload): Promise<ISchemasResponse> {
    return this.ecosystemService.getAllEcosystemSchemas(payload);
  }

  @MessagePattern({ cmd: 'delete-ecosystem-invitations' })
  async deleteInvitation(@Body() payload: { invitationId: string }): Promise<object> {
    return this.ecosystemService.deleteEcosystemInvitations(payload.invitationId);
  }
  @MessagePattern({ cmd: 'fetch-ecosystem-org-data' })
  async fetchEcosystemOrg(@Body() payload: { ecosystemId: string; orgId: string }): Promise<object> {
    return this.ecosystemService.fetchEcosystemOrg(payload);
  }

  /**
   *
   * @param payload
   * @returns Schema endorsement request
   */
  @MessagePattern({ cmd: 'schema-endorsement-request' })
  async schemaEndorsementRequest(payload: {
    requestSchemaPayload: IRequestSchemaEndorsement;
    user: user;
    orgId: string;
    ecosystemId: string;
  }): Promise<IEndorsementTransaction> {
    const { requestSchemaPayload, user, orgId, ecosystemId } = payload;
    return this.ecosystemService.requestSchemaEndorsement(requestSchemaPayload, user, orgId, ecosystemId);
  }

  /**
   *
   * @param payload
   * @returns Schema endorsement request
   */
  @MessagePattern({ cmd: 'credDef-endorsement-request' })
  async credDefEndorsementRequest(payload: {
    requestCredDefPayload: RequestCredDeffEndorsement;
    orgId: string;
    ecosystemId: string;
  }): Promise<IEndorsementTransaction> {
    return this.ecosystemService.requestCredDeffEndorsement(
      payload.requestCredDefPayload,
      payload.orgId,
      payload.ecosystemId
    );
  }

  /**
   *
   * @param payload
   * @returns sign endorsement request
   */
  @MessagePattern({ cmd: 'sign-endorsement-transaction' })
  async signTransaction(payload: { endorsementId: string; ecosystemId: string}): Promise<object> {
    const { endorsementId, ecosystemId } = payload;
    return this.ecosystemService.signTransaction(endorsementId, ecosystemId);
  }

  /**
   *
   * @param payload
   * @returns submit endorsement request
   */
  @MessagePattern({ cmd: 'submit-endorsement-transaction' })
  async submitTransaction(payload: { endorsementId: string; ecosystemId: string; orgId: string, user: IUserRequestInterface}): Promise<object> {
    const { endorsementId, ecosystemId, orgId, user } = payload;
    return this.ecosystemService.submitTransaction({
      endorsementId,
      ecosystemId,
      orgId,
      user
    });
  }

  /**
   *
   * @param payload
   * @returns auto sign and submit endorsement request
   */
  @MessagePattern({ cmd: 'auto-endorsement-transaction' })
  async autoSignAndSubmitTransaction(): Promise<object> {
    return this.ecosystemService.autoSignAndSubmitTransaction();
  }

  /**
   *
   * @param payload
   * @returns Declien Endorsement Transaction status
   */
  @MessagePattern({ cmd: 'decline-endorsement-transaction' })
  async declineEndorsementRequestByLead(payload: { ecosystemId: string; endorsementId: string }): Promise<object> {
    return this.ecosystemService.declineEndorsementRequestByLead(payload.ecosystemId, payload.endorsementId);
  }

  @MessagePattern({ cmd: 'delete-org-from-ecosystem' })
  async deleteOrgFromEcosystem(payload: { orgId: string, userDetails: user}): Promise<IEcosystemDataDeletionResults> {
    const { orgId, userDetails } = payload;
    return this.ecosystemService.deleteOrgFromEcosystem(orgId, userDetails);
  }
}