import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommonService } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { PrismaService } from '@credebl/prisma-service';
import { ClientProxy } from '@nestjs/microservices';
import { NATSClient } from '@credebl/common/NATSClient';
import { getAgentUrl } from '@credebl/common/common.utils';
import {
  IOidcHolderAcceptProofRequest,
  IOidcHolderRequestCredential,
  IOidcHolderResolveCredentialOffer,
  IOidcHolderResolveProofRequest
} from './interfaces/oid4vc-holder.interface';

@Injectable()
export class Oid4vcHolderService {
  private readonly logger = new Logger('Oid4vcHolderService');

  constructor(
    private readonly commonService: CommonService,
    private readonly prisma: PrismaService,
    @Inject('NATS_CLIENT') private readonly natsClientProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  private async getOrgAgentApiKey(orgId: string): Promise<string> {
    const agentDetails = await this.prisma.org_agents.findFirst({
      where: { orgId }
    });
    if (!agentDetails || !agentDetails.apiKey) {
      throw new Error(`Agent API key not found for org: ${orgId}`);
    }
    const decryptedToken = await this.commonService.decryptPassword(agentDetails.apiKey);
    return decryptedToken;
  }

  async _getAgentEndpoint(orgId: string): Promise<string> {
    const payload = { orgId };
    const agentDetails = await this.natsClient.sendNatsMessage(
      this.natsClientProxy,
      'get-agent-details-by-org-id',
      payload
    );
    return (agentDetails as { agentEndPoint: string }).agentEndPoint;
  }

  async oidcHolderResolveCredentialOffer(orgId: string, payload: IOidcHolderResolveCredentialOffer): Promise<object> {
    try {
      const getApiKey = await this.getOrgAgentApiKey(orgId);
      const url = getAgentUrl(await this._getAgentEndpoint(orgId), CommonConstants.OIDC_HOLDER_RESOLVE_OFFER);
      const data = await this.commonService
        .httpPost(url, payload, { headers: { authorization: getApiKey } })
        .then(async (response) => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in oidcHolderResolveCredentialOffer in holder service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async oidcHolderRequestCredential(orgId: string, payload: IOidcHolderRequestCredential): Promise<object> {
    try {
      const getApiKey = await this.getOrgAgentApiKey(orgId);
      const url = getAgentUrl(await this._getAgentEndpoint(orgId), CommonConstants.OIDC_HOLDER_REQUEST_CREDENTIAL);
      const data = await this.commonService
        .httpPost(url, payload, { headers: { authorization: getApiKey } })
        .then(async (response) => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in oidcHolderRequestCredential in holder service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async oidcHolderResolveProofRequest(orgId: string, payload: IOidcHolderResolveProofRequest): Promise<object> {
    try {
      const getApiKey = await this.getOrgAgentApiKey(orgId);
      const url = getAgentUrl(await this._getAgentEndpoint(orgId), CommonConstants.OIDC_HOLDER_RESOLVE_PROOF_REQUEST);
      const data = await this.commonService
        .httpPost(url, payload, { headers: { authorization: getApiKey } })
        .then(async (response) => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in oidcHolderResolveProofRequest in holder service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async oidcHolderAcceptProofRequest(orgId: string, payload: IOidcHolderAcceptProofRequest): Promise<object> {
    try {
      const getApiKey = await this.getOrgAgentApiKey(orgId);
      const url = getAgentUrl(await this._getAgentEndpoint(orgId), CommonConstants.OIDC_HOLDER_ACCEPT_PROOF_REQUEST);
      const data = await this.commonService
        .httpPost(url, payload, { headers: { authorization: getApiKey } })
        .then(async (response) => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in oidcHolderAcceptProofRequest in holder service : ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
