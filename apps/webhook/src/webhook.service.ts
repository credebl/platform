/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { WebhookRepository } from './webhook.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';
import AsyncRetry = require('async-retry');
import { ICreateWebhookUrl, IGetWebhookUrl, IWebhookDto } from '../interfaces/webhook.interfaces';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { IWebhookUrl } from '@credebl/common/interfaces/webhook.interface';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger('WebhookService');
  constructor(private readonly webhookRepository: WebhookRepository) {}

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
            registerWebhookDto.webhookUrl,
            registerWebhookDto.webhookSecret
          );
        } catch (error) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.registerWebhook);
        }

        if (!webhookUrl) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.registerWebhook);
        } else {
          return {
            webhookUrl: webhookUrl.webhookUrl,
            webhookSecret: webhookUrl.webhookSecret
          };
        }
      }
    } catch (error) {
      this.logger.error(`[registerWebhookUrl] - register webhook url details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async updateWebhook(updateWebhookDto: IWebhookDto): Promise<ICreateWebhookUrl> {
    try {
      const orgData = await this.webhookRepository.getOrganizationDetails(updateWebhookDto.orgId);
      let updateWebhook;
      if (!orgData) {
        throw new NotFoundException(ResponseMessages.organisation.error.notFound);
      } else {
        try {
          updateWebhook = await this.webhookRepository.updateWebhook(
            updateWebhookDto.orgId,
            updateWebhookDto.webhookUrl,
            updateWebhookDto.webhookSecret
          );
        } catch (error) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.updateWebhook);
        }

        if (!updateWebhook) {
          throw new InternalServerErrorException(ResponseMessages.webhook.error.updateWebhook);
        } else {
          return {
            webhookUrl: updateWebhook.webhookUrl,
            webhookSecret: updateWebhook.webhookSecret
          };
        }
      }
    } catch (error) {
      this.logger.error(`[updateWebhook] - update webhook details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getWebhookUrl(getWebhook: IWebhookUrl): Promise<IGetWebhookUrl> {
    let webhookUrlInfo;
    try {
      webhookUrlInfo = await this.webhookRepository.getWebhookUrl(getWebhook);

      if (!webhookUrlInfo) {
        throw new NotFoundException(ResponseMessages.webhook.error.notFound);
      }

      return {
        webhookUrl: webhookUrlInfo.webhookUrl,
        webhookSecret: webhookUrlInfo.webhookSecret
      };
    } catch (error) {
      this.logger.error(`[getWebhookUrl] -  webhook url details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async webhookFunc(webhookUrl: string, data: object, webhookSecret?: string): Promise<Response> {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      const requestBody = JSON.stringify(data);

      if (webhookSecret) {
        const timestamp = new Date().getTime().toString();
        const payload = `${timestamp}.${requestBody}`;
        const signature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

        headers['X-Signature'] = signature;
        headers['X-Timestamp'] = timestamp;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: requestBody
      });

      if (!response.ok) {
        this.logger.error(`Error in sending webhook response to org webhook url:`, response.status);
        throw new InternalServerErrorException(ResponseMessages.webhook.error.webhookResponse);
      }
      return response;
    } catch (err) {
      this.logger.error(`Error in sending webhook response to org webhook url: ${err}`);
      throw new InternalServerErrorException(ResponseMessages.webhook.error.webhookResponse);
    }
  }

  async webhookResponse(webhookUrl: string, data: object, webhookSecret?: string): Promise<object> {
    try {
      const webhookResponse = async (): Promise<Response> => this.webhookFunc(webhookUrl, data, webhookSecret);
      const response = await AsyncRetry(webhookResponse, this.retryOptions(this.logger));
      return response;
    } catch (error) {
      this.logger.error(`Error in sending webhook response to org webhook url: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
