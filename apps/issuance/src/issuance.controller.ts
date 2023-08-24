import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IIssuance, IIssuanceWebhookInterface, IIssueCredentials, IIssueCredentialsDefinitions, OutOfBandCredentialOffer } from '../interfaces/issuance.interfaces';
import { IssuanceService } from './issuance.service';

@Controller()
export class IssuanceController {
  private readonly logger = new Logger('issuanceService');
  constructor(private readonly issuanceService: IssuanceService) { }

  @MessagePattern({ cmd: 'send-credential-create-offer' })
  async sendCredentialCreateOffer(payload: IIssuance): Promise<string> {
    const { orgId, user, credentialDefinitionId, comment, connectionId, attributes } = payload;
    return this.issuanceService.sendCredentialCreateOffer(orgId, user, credentialDefinitionId, comment, connectionId, attributes);
  }

  @MessagePattern({ cmd: 'get-all-issued-credentials' })
  async getIssueCredentials(payload: IIssueCredentials): Promise<string> {
    const { user, threadId, connectionId, state, orgId } = payload;
    return this.issuanceService.getIssueCredentials(user, threadId, connectionId, state, orgId);
  }

  @MessagePattern({ cmd: 'get-issued-credentials-by-credentialDefinitionId' })
  async getIssueCredentialsbyCredentialRecordId(payload: IIssueCredentialsDefinitions): Promise<string> {
    const { user, credentialRecordId, orgId } = payload;
    return this.issuanceService.getIssueCredentialsbyCredentialRecordId(user, credentialRecordId, orgId);
  }

  @MessagePattern({ cmd: 'webhook-get-issue-credential' })
  async getIssueCredentialWebhook(payload: IIssuanceWebhookInterface): Promise<object> {
    const { createDateTime, connectionId, threadId, protocolVersion, credentialAttributes, orgId } = payload;
    return this.issuanceService.getIssueCredentialWebhook(createDateTime, connectionId, threadId, protocolVersion, credentialAttributes, orgId);
  }

  @MessagePattern({ cmd: 'out-of-band-credential-offer' })
  async outOfBandCredentialOffer(payload: OutOfBandCredentialOffer): Promise<boolean> {
    const { user, outOfBandCredentialDto } = payload;
    return this.issuanceService.outOfBandCredentialOffer(user, outOfBandCredentialDto);
  }
}
