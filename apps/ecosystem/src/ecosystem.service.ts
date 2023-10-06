// eslint-disable-next-line camelcase
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger

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
  async getAllEcosystem(): Promise<object> {
    const getAllEcosystemDetails = await this.ecosystemRepository.getAllEcosystemDetails();
    if (!getAllEcosystemDetails) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return getAllEcosystemDetails;
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
      return this.ecosystemRepository.updateEcosystemOrgs(data);
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


}
