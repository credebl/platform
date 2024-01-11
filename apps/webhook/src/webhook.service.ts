/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CommonService } from '@credebl/common';
import { WebhookRepository } from './webhook.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import AsyncRetry = require('async-retry');
import { ICreateWebhookUrl, IGetWebhookUrl, IWebhookDto } from '../interfaces/webhook.interfaces';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger('WebhookService');
  constructor(
    @Inject('NATS_CLIENT') private readonly webhookProxy: ClientProxy,
    private readonly commonService: CommonService,
    private readonly webhookRepository: WebhookRepository
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  retryOptions(logger: Logger) {
    return {
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      onRetry(e: { message: string }, attempt: number): void {
        logger.log(`Error:: ${e.message}`);
        logger.log(`Attempt:: ${attempt}`);
       
      }
    };
  }

  async registerWebhook(registerWebhookDto: IWebhookDto): Promise<ICreateWebhookUrl> {
    try {
      const orgData = await this.webhookRepository.getOrganizationDetails(registerWebhookDto.orgId);
      let webhookUrl;
      if (!orgData) {
        throw new NotFoundException(ResponseMessages.organisation.error.notFound);
      } else {
        try {
          webhookUrl = await this.webhookRepository.registerWebhook(
            registerWebhookDto.orgId,
            registerWebhookDto.webhookUrl
          );
        } catch (error) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.registerWebhook);
        }

        if (!webhookUrl) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.registerWebhook);
        } else {
          return webhookUrl.webhookUrl;
        }
      }
    } catch (error) {
      this.logger.error(`[registerWebhookUrl] - register webhook url details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getWebhookUrl(tenantId: string): Promise<IGetWebhookUrl> {
    let webhookUrlInfo;
    try {
      if (null === tenantId) {
        throw new BadRequestException(ResponseMessages.agent.error.nullTenantId);
      } else {
        webhookUrlInfo = await this.webhookRepository.getWebhookUrl(tenantId);
        if (!webhookUrlInfo) {
          throw new NotFoundException(ResponseMessages.agent.error.tenantIdNotFound);
        } else {
          return webhookUrlInfo.webhookUrl;
        }
      }
    } catch (error) {
      this.logger.error(`[getWebhookUrl] -  webhook url details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async webhookFunc(webhookUrl: string, data: object): Promise<Response> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        this.logger.error(`Error in sending webhook response to org webhook url:`, response.status);
        throw new InternalServerErrorException(ResponseMessages.webhook.error.webhookResponse);
      }
      return response;
    } catch (err) {
      throw new InternalServerErrorException(ResponseMessages.webhook.error.webhookResponse);
    }
  }

  async webhookResponse(webhookUrl: string, data: object): Promise<object> {
    try {
      const webhookResponse = async (): Promise<Response> => this.webhookFunc(webhookUrl, data);
      const response = await AsyncRetry(webhookResponse, this.retryOptions(this.logger));
      return response;
    } catch (error) {
      this.logger.error(`Error in sending webhook response to org webhook url: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
