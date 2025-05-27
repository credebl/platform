import type { PrismaService } from '@credebl/prisma-service'
import { Injectable, type Logger } from '@nestjs/common'

import type { shortening_url } from '@prisma/client'

@Injectable()
export class UtilitiesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async saveShorteningUrl(payload): Promise<object> {
    try {
      const { referenceId, invitationPayload } = payload
      const storeShorteningUrl = await this.prisma.shortening_url.upsert({
        where: { referenceId },
        update: { invitationPayload },
        create: { referenceId, invitationPayload },
      })

      this.logger.log(`[saveShorteningUrl] - shortening url details ${referenceId}`)
      return storeShorteningUrl
    } catch (error) {
      this.logger.error(`Error in saveShorteningUrl: ${error} `)
      throw error
    }
  }

  async getShorteningUrl(referenceId): Promise<shortening_url> {
    try {
      const storeShorteningUrl = await this.prisma.shortening_url.findUnique({
        where: {
          referenceId,
        },
      })

      this.logger.log(`[getShorteningUrl] - shortening url details ${referenceId}`)
      return storeShorteningUrl
    } catch (error) {
      this.logger.error(`Error in getShorteningUrl: ${error} `)
      throw error
    }
  }
}
