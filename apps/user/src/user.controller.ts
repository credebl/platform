import { IOrgUsers, Payload, ICheckUserDetails, PlatformSettings, IShareUserCertificate, UpdateUserProfile, IUsersProfile, IUserInformation, IUserSignIn, IUserCredentials, IUserResetPassword, IUserDeletedActivity, UserKeycloakId, IUserInformationUsernameBased, IUserNameSignIn} from '../interfaces/user.interface';
import { AcceptRejectInvitationDto } from '../dtos/accept-reject-invitation.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UserService } from './user.service';
import { VerifyEmailTokenDto } from '../dtos/verify-email.dto';
import { user } from '@prisma/client';
import { IUsersActivity } from 'libs/user-activity/interface';
import { ISendVerificationEmail, ISignInUser, IVerifyUserEmail, IUserInvitations, IResetPasswordResponse, ISignUpUserResponse } from '@credebl/common/interfaces/user.interface';
import { AddPasskeyDetailsDto } from 'apps/api-gateway/src/user/dto/add-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * Description: Registers new user
   * @param email 
   * @returns User's verification email sent status
   */
  @MessagePattern({ cmd: 'send-verification-mail' })
  async sendVerificationMail(payload: { userEmailVerification: ISendVerificationEmail }): Promise<ISendVerificationEmail> {
    return this.userService.sendVerificationMail(payload.userEmailVerification);
  }

  /**
   * Description: Verify user's email
   * @param email
   * @param verificationcode
   * @returns User's email verification status 
   */
  @MessagePattern({ cmd: 'user-email-verification' })
  async verifyEmail(payload: { param: VerifyEmailTokenDto }): Promise<IVerifyUserEmail> {
    return this.userService.verifyEmail(payload.param);
  }
 /**
  * @Body loginUserDto
  * @returns User's access token details
  */

  @MessagePattern({ cmd: 'user-holder-login' })
  async login(payload: IUserSignIn): Promise<ISignInUser> {
   const loginRes = await this.userService.login(payload);   
   return loginRes;
  }


   /**
  * @Body loginUserDto
  * @returns User's access token details
  */

   @MessagePattern({ cmd: 'username-holder-login' })
   async usernameLogin(payload: IUserNameSignIn): Promise<ISignInUser> {
    const loginRes = await this.userService.usernameLogin(payload);   
    return loginRes;
   }


  @MessagePattern({ cmd: 'refresh-token-details' })
  async refreshTokenDetails(refreshToken: string): Promise<ISignInUser> {
   return this.userService.refreshTokenDetails(refreshToken);   
  }

  @MessagePattern({ cmd: 'user-reset-password' })
  async resetPassword(payload: IUserResetPassword): Promise<IResetPasswordResponse> {
   return this.userService.resetPassword(payload);
  }

  @MessagePattern({ cmd: 'user-set-token-password' })
  async resetTokenPassword(payload: IUserResetPassword): Promise<IResetPasswordResponse> {   
    return this.userService.resetTokenPassword(payload);
  }

  @MessagePattern({ cmd: 'user-forgot-password' })
  async forgotPassword(payload: IUserResetPassword): Promise<IResetPasswordResponse> {
   return this.userService.forgotPassword(payload);
  }

  @MessagePattern({ cmd: 'get-user-profile' })
  async getProfile(payload: { id }): Promise<IUsersProfile> {
    return this.userService.getProfile(payload);
  }

  @MessagePattern({ cmd: 'get-user-public-profile' })
  async getPublicProfile(payload: { username }): Promise<IUsersProfile> {
    return this.userService.getPublicProfile(payload);
  }
   /**
   * @returns User details
   */
  @MessagePattern({ cmd: 'update-user-profile' })
  async updateUserProfile(payload: { updateUserProfileDto: UpdateUserProfile }): Promise<user> {
    return this.userService.updateUserProfile(payload.updateUserProfileDto);
  }

  @MessagePattern({ cmd: 'get-user-by-supabase' })
  async findSupabaseUser(payload: { id }): Promise<object> {
    return this.userService.findSupabaseUser(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-keycloak' })
  async findKeycloakUser(payload: { id }): Promise<object> {
    return this.userService.findKeycloakUser(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-mail' })
  async findUserByEmail(payload: { email }): Promise<object> {
    return this.userService.findUserByEmail(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-user-id' })
  async findUserByUserId(id: string): Promise<object> {
    return this.userService.findUserByUserId(id);
  }

  /**
   * @param credentialId
   * @returns User credentials
   */
  @MessagePattern({ cmd: 'get-user-credentials-by-id' })
  async getUserCredentialsById(payload: { credentialId }): Promise<IUserCredentials> {
    return this.userService.getUserCredentialsById(payload);
  }

  /**
   * @returns Organization invitation data
   */
  @MessagePattern({ cmd: 'get-org-invitations' })
  async invitations(payload: { id; status; pageNumber; pageSize; search; }): Promise<IUserInvitations> {
        return this.userService.invitations(payload);
  }
  
  /**
   *
   * @param payload
   * @returns Organization invitation status  fetch-organization-users
   */
  @MessagePattern({ cmd: 'accept-reject-invitations' })
  async acceptRejectInvitations(payload: {
    acceptRejectInvitation: AcceptRejectInvitationDto;
    userId: string;
  }): Promise<IUserInvitations> {
    return this.userService.acceptRejectInvitations(payload.acceptRejectInvitation, payload.userId);
  }

  /**
   * @param payload
   * @returns User certificate URL
   */
  @MessagePattern({ cmd: 'share-user-certificate' })
  async shareUserCertificate(
    shareUserCredentials: IShareUserCertificate
  ): Promise<string> {
    return this.userService.shareUserCertificate(shareUserCredentials);
  }

  /**
   *
   * @param payload
   * @returns organization users list
   */
  @MessagePattern({ cmd: 'fetch-organization-user' })
  async getOrganizationUsers(payload: {orgId:string} & Payload): Promise<IOrgUsers> {
    return this.userService.getOrgUsers(payload.orgId, payload.pageNumber, payload.pageSize, payload.search);
  }

  /**
 * @param payload
 * @returns organization users list
 */
  @MessagePattern({ cmd: 'fetch-users' })
  async get(payload: { pageNumber: number, pageSize: number, search: string }): Promise<object> {
    const users = this.userService.get(payload.pageNumber, payload.pageSize, payload.search);
    return users;
  }
  
  /** 
  * @param email
  * @returns User's email exist status
  * */
  @MessagePattern({ cmd: 'check-user-exist' })
  async checkUserExist(payload: { userEmail: string }): Promise<ICheckUserDetails> {
    return this.userService.checkUserExist(payload.userEmail);
  }
  /**
  * @Body userInfo
  * @returns User's registration status
  */
  @MessagePattern({ cmd: 'add-user' })
  async addUserDetailsInKeyCloak(payload: { userInfo: IUserInformation }): Promise<ISignUpUserResponse> {
    return this.userService.createUserForToken(payload.userInfo);
  }

    /**
  * @Body userInfo
  * @returns User's registration status
  */
    @MessagePattern({ cmd: 'add-user-username-based' })
    async addUserDetailsUsernameBasedInKeyCloak(payload: { userInfo: IUserInformationUsernameBased }): Promise<ISignUpUserResponse> {
      return this.userService.createUserForTokenUsernameBased(payload.userInfo);
    }

  // Fetch Users recent activities
  @MessagePattern({ cmd: 'get-user-activity' })
  async getUserActivity(payload: { userId: string, limit: number }): Promise<IUsersActivity[]> {
    return this.userService.getUserActivity(payload.userId, payload.limit);
  }

  // Delete user
  @MessagePattern({ cmd: 'delete-user' })
  async deleteUser(userId: string): Promise<object> {
    return this.userService.deleteUser(userId);
  }

  @MessagePattern({ cmd: 'add-passkey' })
  async addPasskey(payload: { userEmail: string, userInfo: AddPasskeyDetailsDto }): Promise<string | object> {
    return this.userService.addPasskey(payload.userEmail, payload.userInfo);
  }
 /**
   * @returns platform and ecosystem settings updated status
   */
  @MessagePattern({ cmd: 'update-platform-settings' })
  async updatePlatformSettings(payload: { platformSettings: PlatformSettings }): Promise<string> {
    return this.userService.updatePlatformSettings(payload.platformSettings);
  }
  /**
   * @returns platform and ecosystem settings
   */
  @MessagePattern({ cmd: 'fetch-platform-settings' })
  async getPlatformEcosystemSettings(): Promise<object> {
    return this.userService.getPlatformEcosystemSettings();
  }

  @MessagePattern({ cmd: 'org-deleted-activity' })
  async updateOrgDeletedActivity(payload: { orgId, userId, deletedBy, recordType, userEmail, txnMetadata }): Promise<IUserDeletedActivity> {
    return this.userService.updateOrgDeletedActivity(payload.orgId, payload.userId, payload.deletedBy, payload.recordType, payload.userEmail, payload.txnMetadata);
  }

  @MessagePattern({ cmd: 'get-user-details-by-userId' })
  async getUserDetailsByUserId(payload: { userId: string }): Promise<string> {
    const { userId } = payload;
    return this.userService.getUserDetails(userId);
  }

  @MessagePattern({ cmd: 'get-user-keycloak-id' })
  async getUserKeycloakIdByEmail(userEmails: string[]): Promise<UserKeycloakId[]> {
    return this.userService.getUserKeycloakIdByEmail(userEmails);
  }

  @MessagePattern({ cmd: 'get-user-info-by-user-email-keycloak' })
  async getUserByUserIdInKeycloak(payload: {email}): Promise<string> {
    return this.userService.getUserByUserIdInKeycloak(payload.email);
  }

}
