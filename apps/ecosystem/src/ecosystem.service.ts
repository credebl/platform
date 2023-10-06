// eslint-disable-next-line camelcase
import { ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@credebl/prisma-service';
import { EcosystemInviteTemplate } from '../templates/EcosystemInviteTemplate';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { AcceptRejectEcosystemInvitationDto } from '../dtos/accept-reject-ecosysteminvitation.dto';
import { Invitation } from '@credebl/enum/enum';
import { EcosystemOrgStatus, EcosystemRoles } from '../enums/ecosystem.enum';
import { FetchInvitationsPayload } from '../interfaces/invitations.interface';

@Injectable()
export class EcosystemService {
  constructor(
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger,
    private readonly prisma: PrismaService

  ) { }

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto): Promise<object> {
      const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto);
      if (!createEcosystem) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.update);
      }
      return createEcosystem;
  }


  /**
  *
  * @param editEcosystemDto
  * @returns
  */

  // eslint-disable-next-line camelcase
  async editEcosystem(editEcosystemDto, ecosystemId): Promise<object> {
    const editOrganization = await this.ecosystemRepository.updateEcosystemById(editEcosystemDto, ecosystemId);
    if (!editOrganization) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return editOrganization;
  }

  /**
   *
   *
   * @returns all ecosystem details
   */

  // eslint-disable-next-line camelcase
  async getAllEcosystem(payload: {orgId: string}): Promise<object> {
      const getAllEcosystemDetails = await this.ecosystemRepository.getAllEcosystemDetails(payload.orgId);
      if (!getAllEcosystemDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.update);
      }
      return getAllEcosystemDetails;
    } 


  /**
    * Description: get an ecosystem invitation 
    * @returns Get sent ecosystem invitation details
    */
   
  // eslint-disable-next-line camelcase
  async getEcosystemInvitations(userEmail: string, status: string, pageNumber: number, pageSize: number, search: string): Promise<object> {
    
    try {
      const query = {
        AND: [
          { email: userEmail },
          { status: { contains: search, mode: 'insensitive' } }
        ]
      };

      return await this.ecosystemRepository.getEcosystemInvitationsPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`In error getEcosystemInvitations: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }
        
  /**
   * 
   * @param bulkInvitationDto 
   * @param userId 
   * @returns 
   */
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: string): Promise<string> {
    const { invitations, ecosystemId } = bulkInvitationDto;

    try {
      const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

      for (const invitation of invitations) {
        const { email } = invitation;

        const isInvitationExist = await this.checkInvitationExist(email, ecosystemId);

        if (!isInvitationExist) {
          await this.ecosystemRepository.createSendInvitation(email, ecosystemId, userId);

          try {
            await this.sendInviteEmailTemplate(email, ecosystemDetails.name);
          } catch (error) {
            throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
          }
        }
      }
      return ResponseMessages.ecosystem.success.createInvitation;
    } catch (error) {
      this.logger.error(`In send Invitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  } 

  /**
   *
   * @param acceptRejectEcosystemInvitation
   * @param userId
   * @returns Ecosystem invitation status
   */
  async acceptRejectEcosystemInvitations(acceptRejectInvitation: AcceptRejectEcosystemInvitationDto): Promise<string> {
    try {
      const { orgId, status, invitationId } = acceptRejectInvitation;
      const invitation = await this.ecosystemRepository.getEcosystemInvitationById(invitationId);
      
      if (!invitation) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotFound);
      }

      const updatedInvitation = await this.updateEcosystemInvitation(invitationId, orgId, status);
      if (!updatedInvitation) {
         throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotUpdate);
      }

      if (status === Invitation.REJECTED) {
        return ResponseMessages.ecosystem.success.invitationReject;
      }

      const ecosystemRole = await this.ecosystemRepository.getEcosystemRole(EcosystemRoles.ECOSYSTEM_MEMBER);
      const updateEcosystemOrgs = await this.updatedEcosystemOrgs(orgId, invitation.ecosystemId, ecosystemRole.id);

      if (!updateEcosystemOrgs) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgsNotUpdate);
      }
      return ResponseMessages.ecosystem.success.invitationAccept;
    
    } catch (error) {
      this.logger.error(`acceptRejectInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
  
  async updatedEcosystemOrgs(orgId: string, ecosystemId: string, ecosystemRoleId: string): Promise<object> {
    try {
      const data = {
        orgId,
        status: EcosystemOrgStatus.ACTIVE,
        ecosystemId,
        ecosystemRoleId
      };
      return await this.ecosystemRepository.updateEcosystemOrgs(data);
    } catch (error) {
      this.logger.error(`In newEcosystemMneber : ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * 
   * @param payload 
   * @returns Updated invitation response
   */
  async updateEcosystemInvitation(invitationId: string, orgId: string, status: string): Promise<object> {
    try {
   
      const data = {
        status,
        orgId: String(orgId)
      };
      return this.ecosystemRepository.updateEcosystemInvitation(invitationId, data);

    } catch (error) {
      this.logger.error(`In updateOrgInvitation : ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * 
   * @param email 
   * @param ecosystemId 
   * @returns Returns boolean status for invitation
   */
  async checkInvitationExist(
    email: string,
    ecosystemId: string
  ): Promise<boolean> {
    try {

      const query = {
        email,
        ecosystemId
      };

      const invitations = await this.ecosystemRepository.getEcosystemInvitations(query);

      if (0 < invitations.length) {
        return true;
      }
      return false;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * 
   * @param email 
   * @param ecosystemName 
   * @returns Send invitation mail 
   */
  async sendInviteEmailTemplate(
    email: string,
    ecosystemName: string
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new EcosystemInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Invitation`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(email, ecosystemName);

    //Email is sent to user for the verification through emailData
    const isEmailSent = await sendEmail(emailData);

    return isEmailSent;
  }

  async getInvitationsByEcosystemId(
     payload: FetchInvitationsPayload
     ): Promise<object> {
    try {

      const { ecosystemId, pageNumber, pageSize, search} = payload;
      const ecosystemInvitations = await this.ecosystemRepository.getInvitationsByEcosystemId(ecosystemId, pageNumber, pageSize, search);
      return ecosystemInvitations;
    } catch (error) {
      this.logger.error(`In getInvitationsByEcosystemId : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * 
   * @param payload 
   * @returns 
   */
  async fetchEcosystemOrg(
    payload: { ecosystemId: string, orgId: string}
  ): Promise<object> {

    const isEcosystemEnabled = await this.checkEcosystemEnableFlag();    

    if (!isEcosystemEnabled) {
      throw new ForbiddenException(ResponseMessages.ecosystem.error.ecosystemNotEnabled);
    }

    return this.ecosystemRepository.fetchEcosystemOrg(
      payload
    );
  }

  /**
   * 
   * @returns Returns ecosystem flag from settings
   */
  async checkEcosystemEnableFlag(
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();
    return platformConfigData[0].enableEcosystem;
  }


}
