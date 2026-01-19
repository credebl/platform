import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';
import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  BadRequestException,
  InternalServerErrorException,
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
// eslint-disable-next-line camelcase
import { ecosystem, user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrganizationRepository } from 'apps/organization/repositories/organization.repository';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { EcosystemOrgStatus, EcosystemRoles, Invitation, InviteType } from '@credebl/enum/enum';

import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEcosystemMemberInvitations,
  IGetAllOrgs
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

    // const ecosystemStatus = await this.ecosystemRepository.getEcosystemDetailsByUserId()

    const existingInvitation = await this.ecosystemRepository.getPendingInvitationByEmail(email);

    if (existingInvitation) {
      throw new RpcException({
        statusCode: 409,
        message: ResponseMessages.ecosystem.error.invitationAlreadySent
      });
    }

    const invitedUser = await this.prisma.user.findUnique({
      where: { email }
    });

    const invitation = await this.ecosystemRepository.createEcosystemInvitation({
      email,
      invitedUserId: invitedUser?.id ?? null,
      userId: platformAdminId
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
        throw new RpcException({ statusCode: 409, message: ResponseMessages.ecosystem.error.exists });
      }

      const { userId } = createEcosystemDto;

      if (!userId) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.userIdMissing);
      }

      const invitation = await this.ecosystemRepository.findAcceptedInvitationByUserId(userId);
      const user = await this.userRepository.getUserById(userId);

      if (!user) {
        throw new Error('Error fetching user');
      }

      if (!invitation) {
        throw new ForbiddenException(ResponseMessages.ecosystem.error.invitationRequired);
      }

      // const alreadyCreated = await this.ecosystemRepository.checkEcosystemCreatedByUser(userId);

      // if (alreadyCreated) {
      //   throw new ConflictException(ResponseMessages.ecosystem.error.userEcosystemAlreadyExists);
      // }

      return this.prisma.$transaction(async (tx) => {
        const ecosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto, tx);

        if (!ecosystem) {
          throw new NotFoundException(ResponseMessages.ecosystem.error.notCreated);
        }
        await this.ecosystemRepository.updateEcosystemInvitationDetails(
          user.email,
          ecosystem.id,
          createEcosystemDto.orgId,
          tx
        );

        return ecosystem;
      });
    } catch (error) {
      this.logger.error(`createEcosystem: ${error}`);
      throw error;
    }
  }

  async inviteMemberToEcosystem(orgId: string, reqUser: string, ecosystemId: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findFirst();
      if (!platformConfigData) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.platformConfigNotFound);
      }
      const organization = await this.organizationRepository.getOrgProfile(orgId);
      const user = await this.ecosystemRepository.getUserById(organization.createdBy);
      const checkUser = await this.ecosystemRepository.getEcosystemInvitationsByEmail(user.email, ecosystemId);

      if (checkUser && Invitation.REJECTED === checkUser.status && ecosystemId === checkUser.ecosystemId) {
        const reopenedInvitation = await this.ecosystemRepository.updateEcosystemInvitationStatusByEmail(
          user.email,
          ecosystemId,
          Invitation.PENDING
        );
        if (reopenedInvitation) {
          return true;
        }
      }

      if (checkUser?.ecosystemId === ecosystemId && checkUser.status === Invitation.PENDING) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: `Invitation already exists for org with email ${user.email}`
        });
      }
      await this.ecosystemRepository.createEcosystemInvitation({
        email: user.email,
        invitedUserId: user.id,
        userId: reqUser,
        type: InviteType.MEMBER,
        status: Invitation.PENDING,
        ecosystemId,
        orgId
      });
      const ecosystem = await this.ecosystemRepository.getEcosystemById(ecosystemId);
      const emailData = new EmailDto();
      const inviteMemberTemplate = new InviteMemberToEcosystem();

      emailData.emailFrom = platformConfigData.emailFrom;
      emailData.emailTo = [user.email];
      emailData.emailSubject = `Invitation for ecosystem`;
      emailData.emailHtml = inviteMemberTemplate.sendInviteEmailTemplate(
        `${user.firstName} ${user.lastName}`,
        ecosystem.name
      );
      const response = await this.emailService.sendEmail(emailData);
      if (response) {
        return true;
      } else {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.memberInviteFailed);
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

  async updateEcosystemInvitationStatus(status: Invitation, reqUser: string, ecosystemId: string): Promise<boolean> {
    try {
      const user = await this.ecosystemRepository.getUserById(reqUser);

      if (!user) {
        throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'User not found to send invitation' });
      }

      const result = await this.ecosystemRepository.updateEcosystemInvitationStatusByEmail(
        user.email,
        ecosystemId,
        status
      );

      if (result && result?.status === Invitation.ACCEPTED && result?.ecosystemId) {
        const role = await this.ecosystemRepository.getEcosystemRoleByName(EcosystemRoles.ECOSYSTEM_MEMBER);

        if (!role) {
          throw new Error('Error fetching ecosystem role');
        }

        const ecosystemOrgPayload = {
          orgId: result.invitedOrg,
          status: EcosystemOrgStatus.ACTIVE,
          ecosystemId: result.ecosystemId,
          ecosystemRoleId: role.id,
          userId: result.userId,
          createdBy: reqUser,
          lastChangedBy: reqUser
        };

        const existingOrg = await this.ecosystemRepository.getEcosystemOrg(result.ecosystemId, result.userId);
        if (!existingOrg) {
          const userRecord = await this.ecosystemRepository.createEcosystemOrg(ecosystemOrgPayload);
          this.logger.log('Ecosystem user record created', JSON.stringify(userRecord, null, 2));
        }
      }
      return Boolean(result);
    } catch (error) {
      this.logger.error('updateEcosystemInvitationStatus error', error);
      throw error;
    }
  }

  async deleteOrgsFromEcosystem(ecosystemId: string, orgIds: string[]): Promise<{ count: number }> {
    return this.prisma.$transaction(async (tx) => {
      const deletedCount = await this.ecosystemRepository.deleteOrgFromEcosystem(ecosystemId, orgIds, tx);
      await this.ecosystemRepository.deleteEcosystemInvitationByOrgId(ecosystemId, orgIds, tx);
      return deletedCount;
    });
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    orgIds: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    return this.ecosystemRepository.updateEcosystemOrgStatus(ecosystemId, orgIds, status);
  }

  // eslint-disable-next-line camelcase
  async getAllEcosystemOrgsByEcosystemId(ecosystemId: string): Promise<IGetAllOrgs[]> {
    return this.ecosystemRepository.getAllEcosystemOrgsByEcosystemId(ecosystemId);
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(params: IEcosystemMemberInvitations): Promise<IEcosystemInvitation[]> {
    return this.ecosystemRepository.getEcosystemInvitations(params);
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user> {
    return this.ecosystemRepository.getUserByKeycloakId(keycloakId);
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<ecosystem> {
    return this.ecosystemRepository.getEcosystemDetailsByUserId(userId);
  }

  async getEcosystemOrgDetailsByUserId(
    userId: string,
    ecosystemId: string
  ): Promise<{ ecosystemRole: { name: string } }[]> {
    return this.ecosystemRepository.getEcosystemOrgDetailsByUserId(userId, ecosystemId);
  }
}
