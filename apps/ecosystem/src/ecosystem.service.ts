import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';
import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { IEcosystemInvitations } from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';
import { CreateEcosystemInviteTemplate } from '../templates/create-ecosystem.templates';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { EmailService } from '@credebl/common/email.service';
import { user } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrganizationRepository } from 'apps/organization/repositories/organization.repository';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { Invitation, InviteType } from '@credebl/enum/enum';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository
  ) {}

  /**
   *
   * @param bulkInvitationDto
   * @param userId
   * @returns
   */
  async inviteUserToCreateEcosystem(payload: { email: string; userId: string }): Promise<IEcosystemInvitations> {
    const { email, userId } = payload;

    if (!email || !userId) {
      throw new BadRequestException('Email or userId missing');
    }

    const invitation = await this.ecosystemRepository.createEcosystemInvitation(email, userId);

    const isUserExist = await this.checkUserExistInPlatform(email);
    const userData = await this.getUserUserId(userId);

    await this.sendInviteEmailTemplate(email, userData.firstName, isUserExist);

    return invitation;
  }

  async sendInviteEmailTemplate(email: string, firstName: string, isUserExist: boolean): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findFirst();

    const template = new CreateEcosystemInviteTemplate();
    const emailData = new EmailDto();

    emailData.emailFrom = platformConfigData.emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `Invitation to create a new ecosystem on ${process.env.PLATFORM_NAME}`;
    emailData.emailHtml = template.sendInviteEmailTemplate(email, firstName, isUserExist);

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


  async inviteMemberToEcosystem(orgId: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findFirst();
      const organization = await this.organizationRepository.getOrgProfile(orgId);
      const user = await this.ecosystemRepository.getUserById(organization.createdBy);
      const checkUser = await this.ecosystemRepository.getEcosystemInvitationsByEmail(user.email)
      if (checkUser) {
        console.log("check user",checkUser)
        throw new RpcException({
          statusCode: 409,
          message: `Invitation already exists for org with email ${user.email}`,
        });
      }
      await this.ecosystemRepository.createEcosystemInvitation(user.email, user.id, InviteType.MEMBER, Invitation.PENDING);
      
      const emailData = new EmailDto();

      emailData.emailFrom = platformConfigData.emailFrom;
      emailData.emailTo = [user.email];
      emailData.emailSubject = `Invitation for ecosystem`;
      emailData.emailHtml = '<p>Invitation for ecosystem</p>';
      const response = await this.emailService.sendEmail(emailData);
      if (response) {
        return true;
      }
    } catch (error) {
      this.logger.error('inviteMemberToEcosystem error', error);
      throw error;
    }
    
  }

  async updateEcosystemInvitationStatus(email: string, status: Invitation): Promise<boolean> {
    console.log("in ecosystem sercie")
    try {
     const result = await  this.ecosystemRepository.updateEcosystemInvitationStatusByEmail(email, status); 
     console.log("result", result)
     return true
    } catch (error) {
      this.logger.error('updateEcosystemInvitationStatus error', error);
      throw error;
    }
  }

}

// /**
//  *
//  * @param createEcosystemDto
//  * @returns
//  */

// // eslint-disable-next-line camelcase
// async createEcosystem(createEcosystemDto: ICreateEcosystem): Promise<IEcosystem> {
//   try {
//     const ecosystemExist = await this.ecosystemRepository.checkEcosystemNameExist(createEcosystemDto.name);

//     if (ecosystemExist) {
//       throw new ConflictException(ResponseMessages.ecosystem.error.exists);
//     }

//     const isMultiEcosystemEnabled = await this.ecosystemRepository.getSpecificEcosystemConfig(
//       EcosystemConfigSettings.MULTI_ECOSYSTEM
//     );

//     if ('false' === isMultiEcosystemEnabled?.value) {
//       const ecoOrganizationList = await this.ecosystemRepository.checkEcosystemOrgs(createEcosystemDto.orgId);

//       for (const organization of ecoOrganizationList) {
//         if (organization['ecosystemRole']['name'] === EcosystemRoles.ECOSYSTEM_MEMBER) {
//           throw new ConflictException(ResponseMessages.ecosystem.error.ecosystemOrgAlready);
//         }
//       }
//     }

//     const orgDetails: IGetOrgById = await this.organizationService.getOrganization(
//       createEcosystemDto.orgId,
//       createEcosystemDto.userId
//     );

//     if (!orgDetails) {
//       throw new NotFoundException(ResponseMessages.ecosystem.error.orgNotExist);
//     }

//     if (0 === orgDetails.org_agents.length) {
//       throw new NotFoundException(ResponseMessages.ecosystem.error.orgDidNotExist);
//     }

//     const ecosystemLedgers = orgDetails.org_agents.map((agent) => agent.ledgers?.id);

//     const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto, ecosystemLedgers);
//     if (!createEcosystem) {
//       throw new NotFoundException(ResponseMessages.ecosystem.error.notCreated);
//     }

//     return createEcosystem;
//   } catch (error) {
//     this.logger.error(`createEcosystem: ${error}`);
//     throw error;
//   }
// }
