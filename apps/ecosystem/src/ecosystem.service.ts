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
import { ecosystem, Prisma, user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrganizationRepository } from 'apps/organization/repositories/organization.repository';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { EcosystemOrgStatus, EcosystemRoles, Invitation, InvitationViewRole, InviteType } from '@credebl/enum/enum';

import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEcosystemMemberInvitations,
  IGetAllOrgs
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
import { ErrorHandler } from '@credebl/common';
import { CreateIntentDto } from '../dtos/create-intent.dto';
import { UpdateIntentDto } from '../dtos/update-intent.dto';
import { IPageDetail, PaginatedResponse } from 'apps/api-gateway/common/interface';

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

    const existingInvitation = await this.ecosystemRepository.getPendingInvitationByEmail(email);

    if (existingInvitation) {
      throw new RpcException({
        statusCode: 409,
        message: ResponseMessages.ecosystem.error.invitationAlreadySent
      });
    }

    const invitedUser = await this.userRepository.getUserDetails(email);

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
    const platformConfigData = await this.ecosystemRepository.getPlatformConfigData();

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
      // for (const val of invitationData) {
      //   if (val.invitedOrg && val.ecosystemId) {
      //     const orgDetails = await this.ecosystemRepository.getEcosystemOrg(val.ecosystemId, val.invitedOrg);
      //     if (orgDetails) {
      //       val.organization = orgDetails;
      //     }
      //   }
      // }

      // return invitationData;
      // const includeOrg = invitationData.map(async (val) => {
      //   if (val.invitedOrg && val.ecosystemId) {
      //     const orgDetails = await this.ecosystemRepository.getEcosystemOrg(val.ecosystemId, val.invitedOrg);
      //     if (orgDetails) {
      //       val.organization = orgDetails;
      //     }
      //   } else {
      //     return val;
      //   }
      // });
      // return includeOrg;
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

  async getEcosystems(userId: string, pageDetail: IPageDetail): Promise<PaginatedResponse<IEcosystem>> {
    if (!userId) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.userIdMissing);
    }
    try {
      const ecosystem = await this.ecosystemRepository.getEcosystemByRole(userId, EcosystemRoles.ECOSYSTEM_LEAD);
      if (ecosystem && ecosystem.ecosystemRole.name === EcosystemRoles.ECOSYSTEM_LEAD) {
        const leadEcosystems = await this.ecosystemRepository.getEcosystemsForEcosystemLead(userId, pageDetail);
        return leadEcosystems;
      } else {
        return this.ecosystemRepository.getAllEcosystems(pageDetail);
      }
    } catch (error) {
      this.logger.error('getEcosystems error', error);
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

  async getAllEcosystemOrgsByEcosystemId(
    ecosystemId: string,
    pageDetail: IPageDetail
  ): Promise<PaginatedResponse<IGetAllOrgs>> {
    return this.ecosystemRepository.getAllEcosystemOrgsByEcosystemId(ecosystemId, pageDetail);
  }

  async getEcosystemMemberInvitations(
    params: IEcosystemMemberInvitations,
    pageDetail: IPageDetail
  ): Promise<PaginatedResponse<IEcosystemInvitation>> {
    const { role, ecosystemId, email, userId } = params;

    // NOTE: where clause is constructed at service layer by design decision
    // to keep repository free of conditional logic.
    const baseWhere: Prisma.ecosystem_invitationsWhereInput = {
      deletedAt: null,
      type: InviteType.MEMBER
    };

    let where: Prisma.ecosystem_invitationsWhereInput;

    if (role === InvitationViewRole.ECOSYSTEM_LEAD) {
      where = {
        ...baseWhere,
        ecosystemId
      };
    } else {
      where = {
        ...baseWhere,
        status: Invitation.PENDING,
        OR: [email ? { email } : undefined, userId ? { userId } : undefined].filter(Boolean)
      };
    }
    return this.ecosystemRepository.getEcosystemInvitations(where, pageDetail);
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
  // Intent Template CRUD operations
  async createIntentTemplate(data: {
    orgId?: string;
    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    try {
      const { orgId, intentId, templateId, user } = data;
      const userId = user.id;

      const intent = await this.ecosystemRepository.findIntentById(intentId);

      if (!intent) {
        throw new RpcException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Intent not found'
        });
      }

      if (orgId) {
        const orgMembership = await this.ecosystemRepository.findEcosystemOrg(intent.ecosystemId, orgId);

        if (!orgMembership || orgMembership.status !== EcosystemOrgStatus.ACTIVE) {
          throw new RpcException({
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Provided orgId is not an ACTIVE member of this ecosystem'
          });
        }
      }

      const existingTemplate = await this.ecosystemRepository.findIntentTemplate({
        orgId,
        intentId,
        templateId
      });

      if (existingTemplate) {
        const scope = orgId ? `org ${orgId}` : 'globally';
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: `A template is already assigned to this intent for ${scope}.`
        });
      }
      return await this.ecosystemRepository.createIntentTemplate({
        orgId,
        intentId,
        templateId,
        createdBy: userId
      });
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to create intent template');
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplateById(id: string): Promise<object> {
    try {
      const intentTemplate = await this.ecosystemRepository.getIntentTemplateById(id);
      if (!intentTemplate) {
        throw new NotFoundException('Intent template not found');
      }
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent template');
      this.logger.error(
        `[getIntentTemplateById] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    try {
      return await this.ecosystemRepository.getIntentTemplates({ intentId });
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getIntentTemplatesByIntentId] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    try {
      return await this.ecosystemRepository.getIntentTemplates({ orgId });
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getIntentTemplatesByOrgId] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getAllIntentTemplateByQuery(payload: {
    intentTemplateSearchCriteria: IIntentTemplateSearchCriteria;
  }): Promise<IIntentTemplateList> {
    try {
      const { intentTemplateSearchCriteria } = payload;
      return await this.ecosystemRepository.getAllIntentTemplateByQuery(intentTemplateSearchCriteria);
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getAllIntentTemplateByQuery] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<object | null> {
    try {
      const intentTemplate = await this.ecosystemRepository.getIntentTemplateByIntentAndOrg(intentName, verifierOrgId);
      if (!intentTemplate) {
        this.logger.log(
          `[getIntentTemplateByIntentAndOrg] - No template found for intent ${intentName} and org ${verifierOrgId}`
        );
        return null;
      }
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent template');
      this.logger.error(
        `[getIntentTemplateByIntentAndOrg] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async updateIntentTemplate(
    id: string,
    data: { orgId: string; intentId: string; templateId: string; user: { id: string } }
  ): Promise<object> {
    try {
      const { user, ...templateData } = data;
      if (!user?.id) {
        throw new RpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'user is required'
        });
      }
      return await this.ecosystemRepository.updateIntentTemplate(id, {
        ...templateData,
        lastChangedBy: user.id
      });
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to update intent template');
      this.logger.error(
        `[updateIntentTemplate] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    try {
      const intentTemplate = await this.ecosystemRepository.deleteIntentTemplate(id);
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to delete intent template');
      this.logger.error(
        `[deleteIntentTemplate] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  /**
   * Create a new intent
   */
  async createIntent(createIntentDto: CreateIntentDto): Promise<object> {
    try {
      const { name, description, ecosystemId, userId } = createIntentDto;

      if (!name || !ecosystemId || !userId) {
        throw new BadRequestException('name, ecosystemId and userId are required');
      }

      return this.ecosystemRepository.createIntent({
        name,
        description,
        createdBy: userId,
        ecosystemId
      });
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to create intent');
      this.logger.error(
        `[createIntent] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  /**
   * Get all intents
   */
  async getIntents(
    ecosystemId: string,
    pageDetail: IPageDetail,
    intentId?: string
  ): Promise<PaginatedResponse<object>> {
    try {
      return await this.ecosystemRepository.getIntents(ecosystemId, pageDetail, intentId);
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intents');
      this.logger.error(
        `[getIntents] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getTemplatesByOrgId(orgId: string, pageDetail: IPageDetail): Promise<PaginatedResponse<object>> {
    if (!orgId) {
      throw new BadRequestException('orgId is required');
    }

    return this.ecosystemRepository.getTemplatesByOrgId(orgId, pageDetail);
  }

  /**
   * Update an intent
   */
  async updateIntent(updateIntentDto: UpdateIntentDto): Promise<object> {
    try {
      const { intentId, ecosystemId, userId, name, description } = updateIntentDto;

      if (!intentId || !ecosystemId || !userId) {
        throw new BadRequestException('intentId, ecosystemId and userId are required');
      }

      const intent = await this.ecosystemRepository.updateIntent({
        name,
        description,
        intentId: updateIntentDto.intentId,
        lastChangedBy: userId
      });

      this.logger.log(`[updateIntent] - Intent updated with id ${intent.id}`);
      return intent;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to update intent');
      this.logger.error(
        `[updateIntent] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  /**
   * Delete an intent
   */
  async deleteIntent(data: { ecosystemId: string; intentId: string; userId: string }): Promise<object> {
    const { ecosystemId, intentId, userId } = data;

    return this.ecosystemRepository.deleteIntent({
      ecosystemId,
      intentId,
      userId
    });
  }

  /**
   *   Update ecosystem enable/disable flag
   */
  async updateEcosystemConfig(payload: {
    isEcosystemEnabled: boolean;
    platformAdminId: string;
  }): Promise<{ message: string }> {
    const { isEcosystemEnabled, platformAdminId } = payload;
    if (!platformAdminId) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.platformIdRequired);
    }
    if ('boolean' !== typeof isEcosystemEnabled) {
      throw new BadRequestException(ResponseMessages.ecosystem.error.invalidEcosystemEnabledFlag);
    }

    await this.ecosystemRepository.updateEcosystemConfig({
      isEcosystemEnabled,
      userId: platformAdminId
    });

    return {
      message: ResponseMessages.ecosystem.success.updateEcosystemConfig
    };
  }
}
