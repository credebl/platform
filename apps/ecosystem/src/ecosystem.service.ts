import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';
import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitations
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';
import { CreateEcosystemInviteTemplate } from '../templates/create-ecosystem.templates';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { EmailService } from '@credebl/common/email.service';
import { user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   *
   * @param bulkInvitationDto
   * @param userId
   * @returns
   */
  async inviteUserToCreateEcosystem(payload: {
    email: string;
    platformAdminId: string;
  }): Promise<IEcosystemInvitations> {
    const { email, platformAdminId } = payload;

    if (!email || !platformAdminId) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.emailOrPlatformAdminIdMissing);
    }

    const invitedUser = await this.prisma.user.findUnique({
      where: { email }
    });

    const invitation = await this.ecosystemRepository.createEcosystemInvitation({
      email,
      invitedUserId: invitedUser?.id ?? null,
      platformAdminId
    });

    const isUserExist = Boolean(invitedUser);

    await this.sendInviteEmailTemplate(email, isUserExist);

    return invitation;
  }

  async sendInviteEmailTemplate(email: string, isUserExist: boolean): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findFirst();

    if (!platformConfigData) {
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.platformConfigNotFound);
    }

    const template = new CreateEcosystemInviteTemplate();
    const emailData = new EmailDto();

    emailData.emailFrom = platformConfigData.emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `Invitation to create a new ecosystem on ${process.env.PLATFORM_NAME}`;
    emailData.emailHtml = template.sendInviteEmailTemplate(email, isUserExist);

    return this.emailService.sendEmail(emailData);
  }

  async checkUserExistInPlatform(email: string): Promise<boolean> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email };

    const userData: user = await this.natsClient
      .send<user>(this.ecosystemServiceProxy, pattern, payload)

      .catch((error) => {
        this.logger.error(`catch: ${JSON.stringify(error)}`);
        throw new HttpException(
          {
            status: error.status,
            error: error.message
          },
          error.status
        );
      });
    if (userData?.isEmailVerified) {
      return true;
    }
    return false;
  }

  async getUserUserId(userId: string): Promise<user> {
    const pattern = { cmd: 'get-user-by-user-id' };

    const userData = await this.natsClient.send<user>(this.ecosystemServiceProxy, pattern, userId).catch((error) => {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.error,
          message: error.message
        },
        error.status
      );
    });
    return userData;
  }

  async getInvitationsByUserId(userId: string): Promise<IEcosystemInvitations[]> {
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    try {
      return await this.ecosystemRepository.getInvitationsByUserId(userId);
    } catch (error) {
      this.logger.error('getInvitationsByUserId error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invitationNotFound);
    }
  }

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto: ICreateEcosystem): Promise<IEcosystem> {
    try {
      const ecosystemExist = await this.ecosystemRepository.checkEcosystemNameExist(createEcosystemDto.name);

      if (ecosystemExist) {
        throw new ConflictException(ResponseMessages.ecosystem.error.exists);
      }

      const { userId } = createEcosystemDto;

      if (!userId) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.userIdMissing);
      }
      const invitation = await this.ecosystemRepository.findAcceptedInvitationByUserId(userId);

      if (!invitation) {
        throw new ForbiddenException(ResponseMessages.ecosystem.error.invitationRequired);
      }

      const alreadyCreated = await this.ecosystemRepository.checkEcosystemCreatedByUser(userId);

      if (alreadyCreated) {
        throw new ConflictException(ResponseMessages.ecosystem.error.userEcosystemAlreadyExists);
      }

      const ecosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto);

      if (!ecosystem) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.notCreated);
      }

      return ecosystem;
    } catch (error) {
      this.logger.error(`createEcosystem: ${error}`);
      throw error;
    }
  }

  async getAllEcosystems(): Promise<IEcosystem[]> {
    try {
      return await this.ecosystemRepository.getAllEcosystems();
    } catch (error) {
      this.logger.error('getAllEcosystems error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.fetch);
    }
  }

  async getEcosystemDashboard(ecosystemId: string, orgId: string): Promise<IEcosystemDashboard> {
    if (!ecosystemId || !orgId) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.ecosystemIdOrOrgIdMissing);
    }

    try {
      return await this.ecosystemRepository.getEcosystemDashboard(ecosystemId, orgId);
    } catch (error) {
      this.logger.error('getEcosystemDashboard error', error);
      throw error;
    }
  }
}
