import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AgentServiceService } from './agent-service.service';
import {
  IAgentStatus,
  IConnectionDetails,
  IUserRequestInterface,
  ISendProofRequestPayload,
  IAgentSpinUpSatus,
  IGetCredDefAgentRedirection,
  IGetSchemaAgentRedirection,
  IAgentSpinupDto,
  IIssuanceCreateOffer,
  ITenantCredDef,
  ITenantDto,
  ITenantSchema,
  IOutOfBandCredentialOffer,
  IAgentProofRequest,
  IDidCreate,
  IWallet,
  ITenantRecord,
  ICreateConnectionInvitation,
  IStoreAgent,
  IAgentConfigure
} from './interface/agent-service.interface';
import { user } from '@prisma/client';
import { InvitationMessage } from '@credebl/common/interfaces/agent-service.interface';
import { AgentSpinUpStatus } from '@credebl/enum/enum';
import { SignDataDto, VerifySignatureDto } from 'apps/api-gateway/src/agent-service/dto/agent-service.dto';

@Controller()
export class AgentServiceController {
  constructor(private readonly agentServiceService: AgentServiceService) {}

  /**
   * Spinup the agent by organization
   * @param payload
   * @returns Get agent status
   */
  @MessagePattern({ cmd: 'agent-spinup' })
  async walletProvision(payload: { agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface }): Promise<{
    agentSpinupStatus: AgentSpinUpStatus;
  }> {
    return this.agentServiceService.walletProvision(payload.agentSpinupDto, payload.user);
  }

  //DONE
  @MessagePattern({ cmd: 'create-tenant' })
  async createTenant(payload: {
    createTenantDto: ITenantDto,
    user: IUserRequestInterface,
  }): Promise<IAgentSpinUpSatus> {
    return this.agentServiceService.createTenant(payload.createTenantDto, payload.user);
  }

  /**
   * @returns did
   */
  @MessagePattern({ cmd: 'create-did' })
  async createDid(payload: { createDidDto: IDidCreate, orgId: string, user: IUserRequestInterface }): Promise<object> {
    return this.agentServiceService.createDid(payload.createDidDto, payload.orgId, payload.user);
  }

  @MessagePattern({ cmd: 'create-wallet' })
  async createWallet(payload: { createWalletDto: IWallet, user: IUserRequestInterface }): Promise<ITenantRecord> {
    return this.agentServiceService.createWallet(payload.createWalletDto);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-create-schema' })
  async createSchema(payload: ITenantSchema): Promise<object> {
    return this.agentServiceService.createSchema(payload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-create-w3c-schema' })
  async createW3CSchema(payload: { url, orgId, schemaRequestPayload }): Promise<object> {
    return this.agentServiceService.createW3CSchema(payload.url, payload.orgId, payload.schemaRequestPayload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-get-schema' })
  async getSchemaById(payload: IGetSchemaAgentRedirection): Promise<object> {
    return this.agentServiceService.getSchemaById(payload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-create-credential-definition' })
  async createCredentialDefinition(payload: ITenantCredDef): Promise<object> {
    return this.agentServiceService.createCredentialDefinition(payload);
  }

  // DONE
  @MessagePattern({ cmd: 'agent-get-credential-definition' })
  async getCredentialDefinitionById(payload: IGetCredDefAgentRedirection): Promise<object> {
    return this.agentServiceService.getCredentialDefinitionById(payload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-create-connection-legacy-invitation' })
  async createLegacyConnectionInvitation(payload: {
    connectionPayload: IConnectionDetails;
    url: string,
    orgId: string,
  }): Promise<InvitationMessage> {
    return this.agentServiceService.createLegacyConnectionInvitation(
      payload.connectionPayload,
      payload.url,
      payload.orgId
    );
  }

  @MessagePattern({ cmd: 'agent-send-credential-create-offer' })
  async sendCredentialCreateOffer(payload: {
    issueData: IIssuanceCreateOffer;
    url: string,
    orgId: string,
  }): Promise<object> {
    return this.agentServiceService.sendCredentialCreateOffer(payload.issueData, payload.url, payload.orgId);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-get-all-issued-credentials' })
  async getIssueCredentials(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getIssueCredentials(payload.url, payload.apiKey);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-get-issued-credentials-by-credentialDefinitionId' })
  async getIssueCredentialsbyCredentialRecordId(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getIssueCredentialsbyCredentialRecordId(payload.url, payload.orgId);
  }
  //DONE
  @MessagePattern({ cmd: 'agent-get-proof-presentations' })
  async getProofPresentations(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getProofPresentations(payload.url, payload.apiKey);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-get-proof-presentation-by-id' })
  async getProofPresentationById(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getProofPresentationById(payload.url, payload.orgId);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-send-proof-request' })
  async sendProofRequest(payload: {
    proofRequestPayload: ISendProofRequestPayload,
    url: string,
    orgId: string,
  }): Promise<IAgentProofRequest> {
    return this.agentServiceService.sendProofRequest(payload.proofRequestPayload, payload.url, payload.orgId);
  }
  //DONE
  @MessagePattern({ cmd: 'agent-verify-presentation' })
  async verifyPresentation(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.verifyPresentation(payload.url, payload.orgId);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-get-all-connections' })
  async getConnections(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getConnections(payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-get-connection-details-by-connectionId' })
  async getConnectionsByconnectionId(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getConnectionsByconnectionId(payload.url, payload.orgId);
  }

  /**
   * Get agent health
   * @param payload
   * @returns Get agent health
   */
  @MessagePattern({ cmd: 'agent-health' })
  async getAgentHealth(payload: { user: user, orgId: string }): Promise<IAgentStatus> {
    return this.agentServiceService.getAgentHealthDetails(payload.orgId);
  }

  @MessagePattern({ cmd: 'get-ledger-config' })
  async getLedgerConfig(payload: { user: IUserRequestInterface }): Promise<object> {
    return this.agentServiceService.getLedgerConfigDetails(payload.user);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-send-out-of-band-proof-request' })
  async sendOutOfBandProofRequest(payload: {
    proofRequestPayload: ISendProofRequestPayload,
    url: string,
    orgId: string,
  }): Promise<object> {
    return this.agentServiceService.sendOutOfBandProofRequest(payload.proofRequestPayload, payload.url, payload.orgId);
  }

  //DONE
  @MessagePattern({ cmd: 'get-agent-verified-proof-details' })
  async getVerifiedProofDetails(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getVerifiedProofDetails(payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-schema-endorsement-request' })
  async schemaEndorsementRequest(payload: {
    url: string,
    orgId: string,
    requestSchemaPayload: object,
  }): Promise<object> {
    return this.agentServiceService.schemaEndorsementRequest(payload.url, payload.orgId, payload.requestSchemaPayload);
  }
  @MessagePattern({ cmd: 'agent-credDef-endorsement-request' })
  async credDefEndorsementRequest(payload: {
    url: string;
    orgId: string;
    requestSchemaPayload: object;
  }): Promise<object> {
    return this.agentServiceService.credDefEndorsementRequest(payload.url, payload.orgId, payload.requestSchemaPayload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-sign-transaction' })
  async signTransaction(payload: { url: string, orgId: string, signEndorsementPayload: object }): Promise<object> {
    return this.agentServiceService.signTransaction(payload.url, payload.orgId, payload.signEndorsementPayload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-submit-transaction' })
  async submitTransaction(payload: { url: string; orgId: string, submitEndorsementPayload: object }): Promise<object> {
    return this.agentServiceService.sumbitTransaction(payload.url, payload.orgId, payload.submitEndorsementPayload);
  }

  //DONE
  @MessagePattern({ cmd: 'agent-out-of-band-credential-offer' })
  async outOfBandCredentialOffer(payload: {
    outOfBandIssuancePayload: IOutOfBandCredentialOffer,
    url: string,
    orgId: string,
  }): Promise<object> {
    return this.agentServiceService.outOfBandCredentialOffer(
      payload.outOfBandIssuancePayload,
      payload.url,
      payload.orgId
    );
  }

  @MessagePattern({ cmd: 'delete-wallet' })
  async deleteWallet(payload: { orgId, user }): Promise<object> {
    return this.agentServiceService.deleteWallet(payload.orgId, payload.user);
  }

  @MessagePattern({ cmd: 'agent-receive-invitation-url' })
  async receiveInvitationUrl(payload: { url, orgId, receiveInvitationUrl }): Promise<string> {
    return this.agentServiceService.receiveInvitationUrl(payload.receiveInvitationUrl, payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-receive-invitation' })
  async receiveInvitation(payload: { url, orgId, receiveInvitation }): Promise<string> {
    return this.agentServiceService.receiveInvitation(payload.receiveInvitation, payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-send-question' })
  async sendQuestion(payload: { url, orgId, questionPayload }): Promise<object> {
    return this.agentServiceService.sendQuestion(payload.questionPayload, payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-send-basic-message' })
  async sendBasicMessage(payload: { url, orgId, content }): Promise<object> {
    return this.agentServiceService.sendBasicMessage(payload.content, payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-get-question-answer-record' })
  async getQuestionAnswersRecord(payload: { url: string, orgId: string }): Promise<object> {
    return this.agentServiceService.getQuestionAnswersRecord(payload.url, payload.orgId);
  }

  @MessagePattern({ cmd: 'polygon-create-keys' })
  async createSecp256k1KeyPair(payload: { orgId: string }): Promise<object> {
    return this.agentServiceService.createSecp256k1KeyPair(payload.orgId);
  }

   @MessagePattern({ cmd: 'ethereum-create-keys' })
  async createEthKeyPair(payload: { orgId: string }): Promise<object> {
    return this.agentServiceService.createEthereumKeyPair(payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-create-connection-invitation' })
  async createConnectionInvitation(payload: {
    url: string,
    orgId: string,
    connectionPayload: ICreateConnectionInvitation,
  }): Promise<object> {
    return this.agentServiceService.createConnectionInvitation(payload.url, payload.orgId, payload.connectionPayload);
  }

  /**
   * Configure the agent by organization
   * @param payload
   * @returns Get agent status
   */
  @MessagePattern({ cmd: 'agent-configure' })
  async agentConfigure(payload: {
    agentConfigureDto: IAgentConfigure,
    user: IUserRequestInterface,
  }): Promise<IStoreAgent> {
    return this.agentServiceService.agentConfigure(payload.agentConfigureDto, payload.user);
  }

  /**
   * Sign data from agent
   * @param payload
   * @returns Signed data by agent
   */
  @MessagePattern({ cmd: 'sign-data-from-agent' })
  async signData(payload: { data: SignDataDto; orgId: string }): Promise<unknown> {
    return this.agentServiceService.signDataFromAgent(payload.data, payload.orgId);
  }

  /**
   * Verify signature on a payload from agent
   * @param payload
   * @returns Get agent health
   */
  @MessagePattern({ cmd: 'verify-signature-from-agent' })
  async verifySignature(payload: { data: VerifySignatureDto; orgId: string }): Promise<unknown> {
    return this.agentServiceService.verifySignature(payload.data, payload.orgId);
  }
}
