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
  ForbiddenException,
  HttpStatus
} from '@nestjs/common';

import { ClientProxy, RpcException } from '@nestjs/microservices';
import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';
import { CreateEcosystemInviteTemplate } from '../templates/create-ecosystem.templates';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { InviteMemberToEcosystem } from '../templates/invite-member-template';
import { EmailService } from '@credebl/common/email.service';
import { user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrganizationRepository } from 'apps/organization/repositories/organization.repository';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { Invitation, InviteType } from '@credebl/enum/enum';

import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitations
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository
  ) {}

  private readonly logger = new Logger(EcosystemService.name);
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

    const existingInvitation = await this.ecosystemRepository.findEcosystemInvitationByEmail(email);

    if (existingInvitation) {
      throw new ConflictException(ResponseMessages.ecosystem.error.invitationAlreadySent);
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
    const platformName = process.env.PLATFORM_NAME ?? 'the platform';
    emailData.emailSubject = `Invitation to create a new ecosystem on ${platformName}`;
    emailData.emailHtml = template.sendInviteEmailTemplate(isUserExist);

    return this.emailService.sendEmail(emailData);
  }

  async checkUserExistInPlatform(email: string): Promise<boolean> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email };

    const userData: user = await this.natsClient
      .send<user>(this.ecosystemServiceProxy, pattern, payload)
      .catch((error) => {
        this.logger.error('checkUserExistInPlatform error', error);

        const status = Number(error?.status) || HttpStatus.INTERNAL_SERVER_ERROR;

        throw new HttpException(
          {
            status,
            error: error?.message ?? 'Unexpected error'
          },
          status
        );
      });

    return Boolean(userData?.isEmailVerified);
  }

  async getUserId(userId: string): Promise<user> {
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

  async inviteMemberToEcosystem(orgId: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findFirst();
      const organization = await this.organizationRepository.getOrgProfile(orgId);
      const user = await this.ecosystemRepository.getUserById(organization.createdBy);
      const checkUser = await this.ecosystemRepository.getEcosystemInvitationsByEmail(user.email);
      if (checkUser) {
        throw new RpcException({
          statusCode: 409,
          message: `Invitation already exists for org with email ${user.email}`
        });
      }
      await this.ecosystemRepository.createEcosystemInvitation(
        user.email,
        user.id,
        InviteType.MEMBER,
        Invitation.PENDING
      );

      const emailData = new EmailDto();
      const inviteMemberTemplate = new InviteMemberToEcosystem();

      emailData.emailFrom = platformConfigData.emailFrom;
      emailData.emailTo = [user.email];
      emailData.emailSubject = `Invitation for ecosystem`;
      emailData.emailHtml = inviteMemberTemplate.sendInviteEmailTemplate(
        `${user.firstName} ${user.lastName}`,
        organization.name
      );
      const response = await this.emailService.sendEmail(emailData);
      if (response) {
        return true;
      }
    } catch (error) {
      this.logger.error('inviteMemberToEcosystem error', error);
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

  async updateEcosystemInvitationStatus(email: string, status: Invitation): Promise<boolean> {
    try {
      const result = await this.ecosystemRepository.updateEcosystemInvitationStatusByEmail(email, status);
      return Boolean(result);
    } catch (error) {
      this.logger.error('updateEcosystemInvitationStatus error', error);
      throw error;
    }
  }
}
