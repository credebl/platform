import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AgentServiceService } from './agent-service.service';
import { GetCredDefAgentRedirection, GetSchemaAgentRedirection, IAgentSpinupDto, IIssuanceCreateOffer, ITenantCredDef, ITenantDto, ITenantSchema } from './interface/agent-service.interface';
import { IConnectionDetails, IUserRequestInterface } from './interface/agent-service.interface';
import { ISendProofRequestPayload } from './interface/agent-service.interface';
import { user } from '@prisma/client';

@Controller()
export class AgentServiceController {
  constructor(private readonly agentServiceService: AgentServiceService) { }

  @MessagePattern({ cmd: 'agent-spinup' })
  async walletProvision(payload: { agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface }): Promise<object> {
    return this.agentServiceService.walletProvision(payload.agentSpinupDto, payload.user);
  }

  @MessagePattern({ cmd: 'create-tenant' })
  async createTenant(payload: { createTenantDto: ITenantDto, user: IUserRequestInterface }): Promise<{
    agentSpinupStatus: number;
  }> {
    return this.agentServiceService.createTenant(payload.createTenantDto, payload.user);
  }

  @MessagePattern({ cmd: 'agent-create-schema' })
  async createSchema(payload: ITenantSchema): Promise<object> {
    return this.agentServiceService.createSchema(payload);
  }

  @MessagePattern({ cmd: 'agent-get-schema' })
  async getSchemaById(payload: GetSchemaAgentRedirection): Promise<object> {
    return this.agentServiceService.getSchemaById(payload);
  }

  @MessagePattern({ cmd: 'agent-create-credential-definition' })
  async createCredentialDefinition(payload: ITenantCredDef): Promise<object> {
    return this.agentServiceService.createCredentialDefinition(payload);
  }

  @MessagePattern({ cmd: 'agent-get-credential-definition' })
  async getCredentialDefinitionById(payload: GetCredDefAgentRedirection): Promise<object> {
    return this.agentServiceService.getCredentialDefinitionById(payload);
  }


  @MessagePattern({ cmd: 'agent-create-connection-legacy-invitation' })
  async createLegacyConnectionInvitation(payload: { connectionPayload: IConnectionDetails, url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.createLegacyConnectionInvitation(payload.connectionPayload, payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-send-credential-create-offer' })
  async sendCredentialCreateOffer(payload: { issueData: IIssuanceCreateOffer, url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.sendCredentialCreateOffer(payload.issueData, payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-get-all-issued-credentials' })
  async getIssueCredentials(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getIssueCredentials(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-get-issued-credentials-by-credentialDefinitionId' })
  async getIssueCredentialsbyCredentialRecordId(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getIssueCredentialsbyCredentialRecordId(payload.url, payload.apiKey);
  }
  @MessagePattern({ cmd: 'agent-get-proof-presentations' })
  async getProofPresentations(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getProofPresentations(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-get-proof-presentation-by-id' })
  async getProofPresentationById(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getProofPresentationById(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-send-proof-request' })
  async sendProofRequest(payload: { proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.sendProofRequest(payload.proofRequestPayload, payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-verify-presentation' })
  async verifyPresentation(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.verifyPresentation(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-get-all-connections' })
  async getConnections(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getConnections(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-get-connections-by-connectionId' })
  async getConnectionsByconnectionId(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getConnectionsByconnectionId(payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-health' })
  async getAgentHealth(payload: { user: user, orgId: number }): Promise<object> {
    return this.agentServiceService.getAgentHealthDetails(payload.orgId);
  }

  @MessagePattern({ cmd: 'agent-send-out-of-band-proof-request' })
  async sendOutOfBandProofRequest(payload: { proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.sendOutOfBandProofRequest(payload.proofRequestPayload, payload.url, payload.apiKey);
  }

  @MessagePattern({ cmd: 'agent-proof-form-data' })
  async getProofFormData(payload: { url: string, apiKey: string }): Promise<object> {
    return this.agentServiceService.getProofFormData(payload.url, payload.apiKey);
  }
}
