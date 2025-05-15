import type { IWebhookUrl } from '@credebl/common/interfaces/webhook.interface'
import type { PrismaService } from '@credebl/prisma-service'
/* eslint-disable camelcase */
import { Injectable, type Logger } from '@nestjs/common'
import type { org_agents } from '@prisma/client'
import type { ICreateWebhookUrl, IGetWebhookUrl } from '../interfaces/webhook.interfaces'
@Injectable()
export class WebhookRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async registerWebhook(orgId: string, webhookUrl: string): Promise<ICreateWebhookUrl> {
    try {
      const agentInfo = this.prisma.org_agents.update({
        where: {
          orgId,
        },
        data: {
          webhookUrl,
        },
      })

      return agentInfo
    } catch (error) {
      this.logger.error(`[registerWebhookUrl] - register webhook url details: ${JSON.stringify(error)}`)
      throw error
    }
  }

  async getWebhookUrl(getWebhook: IWebhookUrl): Promise<IGetWebhookUrl> {
    try {
      const { tenantId, orgId } = getWebhook
      let webhookUrlInfo: IGetWebhookUrl

      if ((undefined === tenantId || tenantId === 'default') && orgId) {
        webhookUrlInfo = await this.prisma.org_agents.findFirstOrThrow({
          where: {
            orgId,
          },
        })
      } else if (tenantId && tenantId !== 'default') {
        webhookUrlInfo = await this.prisma.org_agents.findFirstOrThrow({
          where: {
            tenantId,
          },
        })
      }

      return webhookUrlInfo
    } catch (error) {
      this.logger.error(`[getWebhookUrl] -  webhook url details: ${JSON.stringify(error)}`)
      throw error
    }
  }

  async getOrganizationDetails(orgId: string): Promise<org_agents> {
    try {
      return this.prisma.org_agents.findUnique({
        where: {
          orgId,
        },
      })
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`)
      throw error
    }
  }
}
