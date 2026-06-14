import { Injectable } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';

@Injectable()
export class PlatformConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformConfig(): Promise<{ isEcosystemEnabled: boolean } | null> {
    return this.prisma.platform_config.findFirst({
      select: {
        isEcosystemEnabled: true
      }
    });
  }
}
