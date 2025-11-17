/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
  HttpException
} from '@nestjs/common';


import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonService } from '@credebl/common';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { LoginUserDto, LoginUserNameDto } from '../dtos/login-user.dto';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesService } from '@credebl/org-roles';
import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { URLUserEmailTemplate } from '../templates/user-email-template';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from '../repositories/user.repository';
import { VerifyEmailTokenDto } from '../dtos/verify-email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { RecordType, user } from '@prisma/client';
import {
  Attribute,
  ICheckUserDetails,
  OrgInvitations,
  PlatformSettings,
  IShareUserCertificate,
  IOrgUsers,
  UpdateUserProfile,
  IUserCredentials, 
   IUserInformation,
    IUsersProfile,
    IUserResetPassword,
    IPuppeteerOption,
    IShareDegreeCertificateRes,
    IUserDeletedActivity,
    UserKeycloakId,
    IUserInformationUsernameBased
} from '../interfaces/user.interface';
import { AcceptRejectInvitationDto } from '../dtos/accept-reject-invitation.dto';
import { UserActivityService } from '@credebl/user-activity';
import { SupabaseService } from '@credebl/supabase';
import { UserDevicesRepository } from '../repositories/user-device.repository';
import { v4 as uuidv4 } from 'uuid';
import { EcosystemConfigSettings, Invitation, UserCertificateId, UserRole } from '@credebl/enum/enum';
import { WinnerTemplate } from '../templates/winner-template';
import { ParticipantTemplate } from '../templates/participant-template';
import { ArbiterTemplate } from '../templates/arbiter-template';
import validator from 'validator';
import { DISALLOWED_EMAIL_DOMAIN } from '@credebl/common/common.constant';
import { AwsService } from '@credebl/aws';
import puppeteer from 'puppeteer';
import { WorldRecordTemplate } from '../templates/world-record-template';
import { IUsersActivity } from 'libs/user-activity/interface';
import { ISendVerificationEmail, ISignInUser, IVerifyUserEmail, IUserInvitations, IResetPasswordResponse, ISignUpUserResponse } from '@credebl/common/interfaces/user.interface';
import { AddPasskeyDetailsDto } from 'apps/api-gateway/src/user/dto/add-user.dto';
import { URLUserResetPasswordTemplate } from '../templates/reset-password-template';
import { toNumber } from '@credebl/common/cast.helper';
import * as jwt from 'jsonwebtoken';
import { EventPinnacle } from '../templates/event-pinnacle';
import { EventCertificate } from '../templates/event-certificates';
import * as QRCode from 'qrcode';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientRegistrationService: ClientRegistrationService,
    private readonly supabaseService: SupabaseService,
    private readonly commonService: CommonService,
    private readonly orgRoleService: OrgRolesService,
    private readonly userOrgRoleService: UserOrgRolesService,
    private readonly userActivityService: UserActivityService,
    private readonly userRepository: UserRepository,
    private readonly awsService: AwsService,
    private readonly userDevicesRepository: UserDevicesRepository,
    private readonly logger: Logger,
    @Inject('NATS_CLIENT') private readonly userServiceProxy: ClientProxy
  ) {}

  /**
   *
   * @param userEmailVerification
   * @returns
   */

  async sendVerificationMail(userEmailVerification: ISendVerificationEmail): Promise<user> {
    try {
      const { email, brandLogoUrl, platformName, clientId, clientSecret } = userEmailVerification;
  
      if ('PROD' === process.env.PLATFORM_PROFILE_MODE) {
        // eslint-disable-next-line prefer-destructuring
        const domain = email.split('@')[1];
        if (DISALLOWED_EMAIL_DOMAIN.includes(domain)) {
          throw new BadRequestException(ResponseMessages.user.error.InvalidEmailDomain);
        }
      }
  
      const userDetails = await this.userRepository.checkUserExist(email);
  
      if (userDetails) {
        if (userDetails.isEmailVerified) {
          throw new ConflictException(ResponseMessages.user.error.exists);
        } else {
          throw new ConflictException(ResponseMessages.user.error.verificationAlreadySent);
        }
      }
  
      const verifyCode = uuidv4();
      let sendVerificationMail: boolean;

      try {

        const token = await this.clientRegistrationService.getManagementToken(clientId, clientSecret);
        const getClientData = await this.clientRegistrationService.getClientRedirectUrl(clientId, token);

        const [redirectUrl] = getClientData[0]?.redirectUris || [];
  
        if (!redirectUrl) {
          throw new NotFoundException(ResponseMessages.user.error.redirectUrlNotFound);
        }
        sendVerificationMail = await this.sendEmailForVerification(email, verifyCode, redirectUrl, clientId, brandLogoUrl, platformName);
      } catch (error) {
        throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
      }
  
      if (sendVerificationMail) {
        const uniqueUsername = await this.createUsername(email, verifyCode);
        userEmailVerification.username = uniqueUsername;
        userEmailVerification.clientId = clientId;
        userEmailVerification.clientSecret = clientSecret;
        const resUser = await this.userRepository.createUser(userEmailVerification, verifyCode);
        return resUser;
      } 
    } catch (error) {
      this.logger.error(`In Create User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async createUsername(email: string, verifyCode: string): Promise<string> {
    try {
      // eslint-disable-next-line prefer-destructuring
      const emailTrim = email.split('@')[0];

      // Replace special characters with hyphens
      const cleanedUsername = emailTrim.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '-');

      // Generate a 5-digit UUID
      // eslint-disable-next-line prefer-destructuring
      const uuid = verifyCode.split('-')[0];

      // Combine cleaned username and UUID
      const uniqueUsername = `${cleanedUsername}-${uuid}`;

      return uniqueUsername;
    } catch (error) {
      this.logger.error(`Error in createUsername: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param email
   * @param orgName
   * @param verificationCode
   * @returns
   */

  async sendEmailForVerification(email: string, verificationCode: string, redirectUrl: string, clientId: string, brandLogoUrl:string, platformName: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findMany();

      const decryptClientId = await this.commonService.decryptPassword(clientId);
      const urlEmailTemplate = new URLUserEmailTemplate();
      const emailData = new EmailDto();
      emailData.emailFrom = platformConfigData[0].emailFrom;
      emailData.emailTo = email;
      const platform = platformName || process.env.PLATFORM_NAME;
      emailData.emailSubject = `[${platform}] Verify your email to activate your account`;

      emailData.emailHtml = await urlEmailTemplate.getUserURLTemplate(email, verificationCode, redirectUrl, decryptClientId, brandLogoUrl, platformName);
      const isEmailSent = await sendEmail(emailData);
      if (isEmailSent) {
        return isEmailSent;
      } else {
        throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
      }
    } catch (error) {
      this.logger.error(`Error in sendEmailForVerification: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param param email, verification code
   * @returns Email verification succcess
   */

  async verifyEmail(param: VerifyEmailTokenDto): Promise<IVerifyUserEmail> {
    try {
      const invalidMessage = ResponseMessages.user.error.invalidEmailUrl;

      if (!param.verificationCode || !param.email) {
        throw new UnauthorizedException(invalidMessage);
      }

      const userDetails = await this.userRepository.getUserDetails(param.email);

      if (!userDetails || param.verificationCode !== userDetails.verificationCode) {
        throw new UnauthorizedException(invalidMessage);
      }

      if (userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.verifiedEmail);
      }

      if (param.verificationCode === userDetails.verificationCode) {
        const verifiedEmail = await this.userRepository.verifyUser(param.email);
        return verifiedEmail;
      }
    } catch (error) {
      this.logger.error(`error in verifyEmail: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async createUserForToken(userInfo: IUserInformation): Promise<ISignUpUserResponse> {
    try {
      const { email } = userInfo;
      if (!userInfo.email) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
      }
      const checkUserDetails = await this.userRepository.getUserDetails(userInfo.email.toLowerCase());

      if (!checkUserDetails) {
        throw new NotFoundException(ResponseMessages.user.error.emailIsNotVerified);
      }
      if (checkUserDetails.keycloakUserId || (!checkUserDetails.keycloakUserId && checkUserDetails.supabaseUserId)) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      }
      if (false === checkUserDetails.isEmailVerified) {
        throw new NotFoundException(ResponseMessages.user.error.verifyEmail);
      }
      const resUser = await this.userRepository.updateUserInfo(userInfo.email.toLowerCase(), userInfo);
      if (!resUser) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }
      const userDetails = await this.userRepository.getUserDetails(userInfo.email.toLowerCase());
      if (!userDetails) {
        throw new NotFoundException(ResponseMessages.user.error.adduser);
      }
   let keycloakDetails = null;
      
   const token = await this.clientRegistrationService.getManagementToken(checkUserDetails.clientId, checkUserDetails.clientSecret);
      if (userInfo.isPasskey) {
        const resUser = await this.userRepository.addUserPassword(email.toLowerCase(), userInfo.password);
        const userDetails = await this.userRepository.getUserDetails(email.toLowerCase());
        const decryptedPassword = await this.commonService.decryptPassword(userDetails.password);

        if (!resUser) {
          throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
        }

        userInfo.password = decryptedPassword;
        try {          
          keycloakDetails = await this.clientRegistrationService.createUser(userInfo, process.env.KEYCLOAK_REALM, token);
        } catch (error) {
          throw new InternalServerErrorException('Error while registering user on keycloak');
        }
      } else {
        const decryptedPassword = await this.commonService.decryptPassword(userInfo.password);

        userInfo.password = decryptedPassword;

        try {          
          keycloakDetails = await this.clientRegistrationService.createUser(userInfo, process.env.KEYCLOAK_REALM, token);
        } catch (error) {
          throw new InternalServerErrorException('Error while registering user on keycloak');
        }
      }

      await this.userRepository.updateUserDetails(userDetails.id,
        keycloakDetails.keycloakUserId.toString()
      );

      if (userInfo?.isHolder) {
        const getUserRole = await this.userRepository.getUserRole(UserRole.HOLDER);

        if (!getUserRole) {
          throw new NotFoundException(ResponseMessages.user.error.userRoleNotFound);
        }
        await this.userRepository.storeUserRole(userDetails.id, getUserRole?.id);
      }

      const realmRoles = await this.clientRegistrationService.getAllRealmRoles(token);
      
      const holderRole = realmRoles.filter(role => role.name === OrgRoles.HOLDER);
      const holderRoleData =  0 < holderRole.length && holderRole[0];

      const payload = [
        {
          id: holderRoleData.id,
          name: holderRoleData.name
        }
      ];

      await this.clientRegistrationService.createUserHolderRole(token,  keycloakDetails.keycloakUserId.toString(), payload);
      const holderOrgRole = await this.orgRoleService.getRole(OrgRoles.HOLDER);
      await this.userOrgRoleService.createUserOrgRole(userDetails.id, holderOrgRole.id, null, holderRoleData.id);

      return { userId: userDetails?.id };
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  async createUserForTokenUsernameBased(userInfo: IUserInformationUsernameBased): Promise<ISignUpUserResponse> {
    try {
      
      const checkUserDetails = await this.userRepository.getUserDetailsByUsername(userInfo.username);

      if (checkUserDetails) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      }

      const resUser = await this.userRepository.createUserWithoutVerification(userInfo);
      let keycloakDetails = null;
      
      const token = await this.clientRegistrationService.getManagementToken(userInfo.clientId, userInfo.clientSecret);
      if (userInfo.isPasskey) {
        const resUser = await this.userRepository.addUserPasswordByUserName(userInfo.username, userInfo.password);
        const userDetails = await this.userRepository.getUserDetailsByUsername(userInfo.username);
        const decryptedPassword = await this.commonService.decryptPassword(userDetails.password);

        if (!resUser) {
          throw new NotFoundException(ResponseMessages.user.error.invalidUsername);
        }

        userInfo.password = decryptedPassword;
        try {          
          keycloakDetails = await this.clientRegistrationService.createUserUserNameBased(userInfo, process.env.KEYCLOAK_REALM, token);
        } catch (error) {
          throw new InternalServerErrorException('Error while registering user on keycloak');
        }
      } else {
        const decryptedPassword = await this.commonService.decryptPassword(userInfo.password);

        userInfo.password = decryptedPassword;

        try {          
          keycloakDetails = await this.clientRegistrationService.createUserUserNameBased(userInfo, process.env.KEYCLOAK_REALM, token);
        } catch (error) {
          throw new InternalServerErrorException('Error while registering user on keycloak');
        }
      }

      await this.userRepository.updateUserDetails(resUser.id,
        keycloakDetails.keycloakUserId.toString()
      );

      if (userInfo?.isHolder) {
        const getUserRole = await this.userRepository.getUserRole(UserRole.HOLDER);

        if (!getUserRole) {
          throw new NotFoundException(ResponseMessages.user.error.userRoleNotFound);
        }
        await this.userRepository.storeUserRole(resUser.id, getUserRole?.id);
      }

      const realmRoles = await this.clientRegistrationService.getAllRealmRoles(token);
      
      const holderRole = realmRoles.filter(role => role.name === OrgRoles.HOLDER);
      const holderRoleData =  0 < holderRole.length && holderRole[0];

      const payload = [
        {
          id: holderRoleData.id,
          name: holderRoleData.name
        }
      ];

      await this.clientRegistrationService.createUserHolderRole(token,  keycloakDetails.keycloakUserId.toString(), payload);
      const holderOrgRole = await this.orgRoleService.getRole(OrgRoles.HOLDER);
      await this.userOrgRoleService.createUserOrgRole(resUser.id, holderOrgRole.id, null, holderRoleData.id);

      return { userId: resUser?.id };
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteUser(userId:string): Promise<object> {

    const res = await this.userRepository.deleteUser(userId);

    const token = await this.clientRegistrationService.getManagementToken(res.clientId, res.clientSecret);
    return this.clientRegistrationService.deleteUser(res.keycloakUserId, process.env.KEYCLOAK_REALM, token);

  }

  async addPasskey(email: string, userInfo: AddPasskeyDetailsDto): Promise<string> {
    try {
      if (!email.toLowerCase()) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
      }
      const checkUserDetails = await this.userRepository.getUserDetails(email.toLowerCase());
      if (!checkUserDetails) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }
      if (!checkUserDetails.keycloakUserId) {
        throw new ConflictException(ResponseMessages.user.error.notFound);
      }
      if (false === checkUserDetails.isEmailVerified) {
        throw new NotFoundException(ResponseMessages.user.error.emailNotVerified);
      }

      const decryptedPassword = await this.commonService.decryptPassword(userInfo.password);
      const tokenResponse = await this.generateToken(email.toLowerCase(), decryptedPassword, checkUserDetails);

      if (!tokenResponse) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidCredentials);
      }

      const resUser = await this.userRepository.addUserPassword(email.toLowerCase(), userInfo.password);
      if (!resUser) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }

      return ResponseMessages.user.success.updateUserProfile;
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  private validateEmail(email: string): void {
    if (!validator.isEmail(email.toLowerCase())) {
      throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
    }
  }

  /**
   *
   * @param loginUserDto
   * @returns User access token details
   */
  async login(loginUserDto: LoginUserDto): Promise<ISignInUser> {
    const { email, password, isPasskey } = loginUserDto;

    try {

      this.validateEmail(email.toLowerCase());
      const userData = await this.userRepository.checkUserExist(email.toLowerCase());
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (userData && !userData.isEmailVerified) {
        throw new BadRequestException(ResponseMessages.user.error.verifyMail);
      }

      if (true === isPasskey && false === userData?.isFidoVerified) {
        throw new UnauthorizedException(ResponseMessages.user.error.registerFido);
      }

      if (true === isPasskey && userData?.username && true === userData?.isFidoVerified) {
        const getUserDetails = await this.userRepository.getUserDetails(userData.email.toLowerCase());
        const decryptedPassword = await this.commonService.decryptPassword(getUserDetails.password);
        return await this.generateToken(email.toLowerCase(), decryptedPassword, userData);
      } else {

        const decryptedPassword = await this.commonService.decryptPassword(password);
        return await this.generateToken(email.toLowerCase(), decryptedPassword, userData);        
      }
    } catch (error) {
      this.logger.error(`In Login User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async usernameLogin(loginUserDto: LoginUserNameDto): Promise<ISignInUser> {
    const { username, password, isPasskey } = loginUserDto;

    try {

      const userData = await this.userRepository.getUserDetailsByUsername(username);
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (true === isPasskey && false === userData?.isFidoVerified) {
        throw new UnauthorizedException(ResponseMessages.user.error.registerFido);
      }

      if (true === isPasskey && userData?.username && true === userData?.isFidoVerified) {
        const getUserDetails = await this.userRepository.getUserDetailsByUsername(username);
        const decryptedPassword = await this.commonService.decryptPassword(getUserDetails.password);
        return await this.generateToken(username, decryptedPassword, userData);
      } else {

        const decryptedPassword = await this.commonService.decryptPassword(password);
        return await this.generateToken(username, decryptedPassword, userData);        
      }
    } catch (error) {
      this.logger.error(`In Login User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async refreshTokenDetails(refreshToken: string): Promise<ISignInUser> {

    try {
        try {
          const data = jwt.decode(refreshToken) as jwt.JwtPayload;
          const userByKeycloakId = await this.userRepository.getUserByKeycloakId(data?.sub);
          const tokenResponse = await this.clientRegistrationService.getAccessToken(refreshToken, userByKeycloakId?.['clientId'], userByKeycloakId?.['clientSecret']);
          return tokenResponse;
        } catch (error) {
          throw new BadRequestException(ResponseMessages.user.error.invalidRefreshToken);
        }
   
    } catch (error) {
      this.logger.error(`In refreshTokenDetails : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);

    }
  }

  async updateFidoVerifiedUser(email: string, isFidoVerified: boolean, password: string): Promise<boolean> {
    if (isFidoVerified) {
      await this.userRepository.addUserPassword(email.toLowerCase(), password);
      return true;
    }
  }

  /**
   * Forgot password
   * @param forgotPasswordDto 
   * @returns 
   */
  async forgotPassword(forgotPasswordDto: IUserResetPassword): Promise<IResetPasswordResponse> {
    const { email } = forgotPasswordDto;

    try {
      this.validateEmail(email.toLowerCase());
      const userData = await this.userRepository.checkUserExist(email.toLowerCase());
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (userData && !userData.isEmailVerified) {
        throw new BadRequestException(ResponseMessages.user.error.verifyMail);
      }

      const token = uuidv4();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 1); // Set expiration time to 1 hour from now
  
      const tokenCreated = await this.userRepository.createTokenForResetPassword(userData.id, token, expirationTime);

      if (!tokenCreated) {
        throw new InternalServerErrorException(ResponseMessages.user.error.resetPasswordLink);
      }

      try {
        await this.sendEmailForResetPassword(email, tokenCreated.token);
      } catch (error) {
        throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
      }

      return {
        id: tokenCreated.id,
        email: userData.email
      };
      
    } catch (error) {
      this.logger.error(`Error In forgotPassword : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Send email for token verification of reset password
   * @param email 
   * @param verificationCode 
   * @returns 
   */
  async sendEmailForResetPassword(email: string, verificationCode: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findMany();

      const urlEmailTemplate = new URLUserResetPasswordTemplate();
      const emailData = new EmailDto();
      emailData.emailFrom = platformConfigData[0].emailFrom;
      emailData.emailTo = email;
      emailData.emailSubject = `[${process.env.PLATFORM_NAME}] Important: Password Reset Request`;

      emailData.emailHtml = await urlEmailTemplate.getUserResetPasswordTemplate(email, verificationCode);
      const isEmailSent = await sendEmail(emailData);
      if (isEmailSent) {
        return isEmailSent;
      } else {
        throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
      }
    } catch (error) {
      this.logger.error(`Error in sendEmailForResetPassword: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Create reset password token
   * @param resetPasswordDto 
   * @returns user details
   */
  async resetTokenPassword(resetPasswordDto: IUserResetPassword): Promise<IResetPasswordResponse> {
    
    const { email, password, token } = resetPasswordDto;

    try {
      this.validateEmail(email.toLowerCase());
      const userData = await this.userRepository.checkUserExist(email.toLowerCase());
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (userData && !userData.isEmailVerified) {
        throw new BadRequestException(ResponseMessages.user.error.verifyMail);
      }
 
      const tokenDetails = await this.userRepository.getResetPasswordTokenDetails(userData.id, token);

      if (!tokenDetails || (new Date() > tokenDetails.expiresAt)) {
        throw new BadRequestException(ResponseMessages.user.error.invalidResetLink);
      }

      const decryptedPassword = await this.commonService.decryptPassword(password);
      try {    
        

        const authToken = await this.clientRegistrationService.getManagementToken(userData.clientId, userData.clientSecret);  
        userData.password = decryptedPassword;
        if (userData.keycloakUserId) {
          await this.clientRegistrationService.resetPasswordOfUser(userData, process.env.KEYCLOAK_REALM, authToken);
        } else {          
          const keycloakDetails = await this.clientRegistrationService.createUser(userData, process.env.KEYCLOAK_REALM, authToken);
          await this.userRepository.updateUserDetails(userData.id,
            keycloakDetails.keycloakUserId.toString()
          );
        }

        await this.updateFidoVerifiedUser(email.toLowerCase(), userData.isFidoVerified, password);

      } catch (error) {
        this.logger.error(`Error reseting the password`, error);
        throw new InternalServerErrorException('Error while reseting user password');
      }

      await this.userRepository.deleteResetPasswordToken(tokenDetails.id);

      return {
        id: userData.id,
        email: userData.email
      };
      
    } catch (error) {
      this.logger.error(`Error In resetTokenPassword : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  findUserByUserId(id: string): Promise<IUsersProfile> {
    return this.userRepository.getUserById(id);

  }

  async resetPassword(resetPasswordDto: IUserResetPassword): Promise<IResetPasswordResponse> {
    const { email, oldPassword, newPassword } = resetPasswordDto;

    try {
      this.validateEmail(email.toLowerCase());
      const userData = await this.userRepository.checkUserExist(email.toLowerCase());
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (userData && !userData.isEmailVerified) {
        throw new BadRequestException(ResponseMessages.user.error.verifyMail);
      }

      const oldDecryptedPassword = await this.commonService.decryptPassword(oldPassword);
      const newDecryptedPassword = await this.commonService.decryptPassword(newPassword);

      if (oldDecryptedPassword === newDecryptedPassword) {
        throw new BadRequestException(ResponseMessages.user.error.resetSamePassword);
      }

      const tokenResponse = await this.generateToken(email.toLowerCase(), oldDecryptedPassword, userData);
      
      if (tokenResponse) {
        userData.password = newDecryptedPassword;
        try {    
          let keycloakDetails = null;    
          const token = await this.clientRegistrationService.getManagementToken(userData.clientId, userData.clientSecret);  

          if (userData.keycloakUserId) {

            keycloakDetails = await this.clientRegistrationService.resetPasswordOfUser(userData, process.env.KEYCLOAK_REALM, token);
            await this.updateFidoVerifiedUser(email.toLowerCase(), userData.isFidoVerified, newPassword);

          } else {
            keycloakDetails = await this.clientRegistrationService.createUser(userData, process.env.KEYCLOAK_REALM, token);
            await this.userRepository.updateUserDetails(userData.id,
              keycloakDetails.keycloakUserId.toString()
            );
            await this.updateFidoVerifiedUser(email.toLowerCase(), userData.isFidoVerified, newPassword);
          }

          return {
            id: userData.id,
            email: userData.email
          };
    
        } catch (error) {
          throw new InternalServerErrorException('Error while registering user on keycloak');
        }
      } else {
        throw new BadRequestException(ResponseMessages.user.error.invalidCredentials);
      }

    } catch (error) {
      this.logger.error(`In Login User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async generateToken(email: string, password: string, userData: user): Promise<ISignInUser> {

      if (userData.keycloakUserId) {

        try {
          const tokenResponse = await this.clientRegistrationService.getUserToken(email, password, userData.clientId, userData.clientSecret);
          tokenResponse.isRegisteredToSupabase = false;
          return tokenResponse;
        } catch (error) {
          throw new UnauthorizedException(ResponseMessages.user.error.invalidCredentials);
        }
       
      } else {
        const supaInstance = await this.supabaseService.getClient();  
        const { data, error } = await supaInstance.auth.signInWithPassword({
          email,
          password
        });
  
        this.logger.error(`Supa Login Error::`, JSON.stringify(error));
  
        if (error) {
          throw new BadRequestException(error?.message);
        }
  
        const token = data?.session;

        return {
          // eslint-disable-next-line camelcase
          access_token: token.access_token,
          // eslint-disable-next-line camelcase
          token_type: token.token_type,
          // eslint-disable-next-line camelcase
          expires_in: token.expires_in,
          // eslint-disable-next-line camelcase
          expires_at: token.expires_at,
          isRegisteredToSupabase: true
        };
      }
  }

  async getProfile(payload: { id }): Promise<IUsersProfile> {
    try {
      const userData = await this.userRepository.getUserById(payload.id);
      const ecosystemSettingsList = await this.prisma.ecosystem_config.findMany({
        where: {
          OR: [{ key: EcosystemConfigSettings.ENABLE_ECOSYSTEM }, { key: EcosystemConfigSettings.MULTI_ECOSYSTEM }]
        }
      });

      for (const setting of ecosystemSettingsList) {
        userData[setting.key] = 'true' === setting.value;
      }

      return userData;
    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getPublicProfile(payload: { username }): Promise<IUsersProfile> {
    try {
      const userProfile = await this.userRepository.getUserPublicProfile(payload.username);

      if (!userProfile) {
        throw new NotFoundException(ResponseMessages.user.error.profileNotFound);
      }

      return userProfile;
    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getUserCredentialsById(payload: { credentialId }): Promise<IUserCredentials> {
    try {
      const userCredentials = await this.userRepository.getUserCredentialsById(payload.credentialId);
      if (!userCredentials) {
        throw new NotFoundException(ResponseMessages.user.error.credentialNotFound);
      }
      return userCredentials;
    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async updateUserProfile(updateUserProfileDto: UpdateUserProfile): Promise<user> {
    try {
      return this.userRepository.updateUserProfile(updateUserProfileDto);
    } catch (error) {
      this.logger.error(`update user profile: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async findByKeycloakId(payload: { id }): Promise<object> {
    try {
      return this.userRepository.getUserBySupabaseId(payload.id);
    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async findSupabaseUser(payload: { id }): Promise<object> {
    try {
      return await this.userRepository.getUserBySupabaseId(payload.id);
    } catch (error) {
      this.logger.error(`Error in findSupabaseUser: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async findKeycloakUser(payload: { id }): Promise<object> {
    try {
      return await this.userRepository.getUserByKeycloakId(payload.id);
    } catch (error) {
      this.logger.error(`Error in findKeycloakUser: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async findUserByEmail(payload: { email }): Promise<object> {
    try {
      return await this.userRepository.findUserByEmail(payload.email);
    } catch (error) {
      this.logger.error(`findUserByEmail: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async invitations(payload: { id; status; pageNumber; pageSize; search }): Promise<IUserInvitations> {
    try {
      const userData = await this.userRepository.getUserById(payload.id);
      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      const invitationsData = await this.getOrgInvitations(
        userData.email,
        payload.status,
        payload.pageNumber,
        payload.pageSize,
        payload.search
        );
       
        const invitations: OrgInvitations[] = await this.updateOrgInvitations(invitationsData['invitations']);
        invitationsData['invitations'] = invitations;

      return invitationsData;
      
    } catch (error) {
      this.logger.error(`Error in get invitations: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getOrgInvitations(
    email: string,
    status: string,
    pageNumber: number,
    pageSize: number,
    search = ''
  ): Promise<IUserInvitations> {
    const pattern = { cmd: 'fetch-user-invitations' };
    const payload = {
      email,
      status,
      pageNumber,
      pageSize,
      search
    };

    const invitationsData = await this.userServiceProxy
      .send(pattern, payload)
      .toPromise()
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

    return invitationsData;
  }

  async updateOrgInvitations(invitations: OrgInvitations[]): Promise<OrgInvitations[]> {

    
    const updatedInvitations = [];

    for (const invitation of invitations) {
      const { status, id, organisation, orgId, userId, orgRoles } = invitation;

      const roles = await this.orgRoleService.getOrgRolesByIds(orgRoles as string[]);

      updatedInvitations.push({
        orgRoles: roles,
        status,
        id,
        orgId,
        organisation,
        userId
      });
    }

    return updatedInvitations;
  }

  /**
   *
   * @param acceptRejectInvitation
   * @param userId
   * @returns Organization invitation status
   */
  async acceptRejectInvitations(acceptRejectInvitation: AcceptRejectInvitationDto, userId: string): Promise<IUserInvitations> {
    try {
      const userData = await this.userRepository.getUserById(userId);
     
      if (Invitation.ACCEPTED === acceptRejectInvitation.status) {
        const payload = {userId};
        const TotalOrgs = await this._getTotalOrgCount(payload);
  
        if (TotalOrgs >= toNumber(`${process.env.MAX_ORG_LIMIT}`)) {
        throw new BadRequestException(ResponseMessages.user.error.userOrgsLimit);
         }
      }
      return this.fetchInvitationsStatus(acceptRejectInvitation, userData.keycloakUserId, userData.email, userId);
    } catch (error) {
      this.logger.error(`acceptRejectInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async  _getTotalOrgCount(payload): Promise<number> {
    const pattern = { cmd: 'get-organizations-count' };

    const getOrganizationCount = await this.userServiceProxy
      .send(pattern, payload)
      .toPromise()
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

    return getOrganizationCount;
  }

  async shareUserCertificate(shareUserCertificate: IShareUserCertificate): Promise<string> {

    let template;
    const attributeArray = [];
    let attributeJson = {};
    const attributePromises = shareUserCertificate.attributes.map(async (iterator: Attribute) => {
      attributeJson = {
        [iterator.name]: iterator.value
      };
      attributeArray.push(attributeJson);
    });
    await Promise.all(attributePromises);
    switch (shareUserCertificate.schemaId.split(':')[2]) {
      case UserCertificateId.WINNER:
        // eslint-disable-next-line no-case-declarations
        const userWinnerTemplate = new WinnerTemplate();
        template = await userWinnerTemplate.getWinnerTemplate(attributeArray);
        break;
      case UserCertificateId.PARTICIPANT:
        // eslint-disable-next-line no-case-declarations
        const userParticipantTemplate = new ParticipantTemplate();
        template = await userParticipantTemplate.getParticipantTemplate(attributeArray);
        break;
      case UserCertificateId.ARBITER:
        // eslint-disable-next-line no-case-declarations
        const userArbiterTemplate = new ArbiterTemplate();
        template = await userArbiterTemplate.getArbiterTemplate(attributeArray);
        break;
      case UserCertificateId.WORLD_RECORD:
        // eslint-disable-next-line no-case-declarations
        const userWorldRecordTemplate = new WorldRecordTemplate();
        template = await userWorldRecordTemplate.getWorldRecordTemplate(attributeArray);
        break;
        case UserCertificateId.AYANWORKS_EVENT:
           // eslint-disable-next-line no-case-declarations
           const QRDetails = await this.getShorteningURL(shareUserCertificate, attributeArray);

           if (shareUserCertificate.attributes.some(item => item.value.toLocaleLowerCase().includes('pinnacle'))) {
            const userPinnacleTemplate = new EventPinnacle();
            template = await userPinnacleTemplate.getPinnacleWinner(attributeArray, QRDetails);
          } else {
            const userCertificateTemplate = new EventCertificate();
            template = await userCertificateTemplate.getCertificateWinner(attributeArray, QRDetails);
          }
          break;  
      default:
        throw new NotFoundException('error in get attributes');
    }

    //Need to handle the option for all type of certificate
    const option: IPuppeteerOption = {height: 974, width: 1606};

    const imageBuffer = 
    await this.convertHtmlToImage(template, shareUserCertificate.credentialId, option);

    const imageUrl = await this.awsService.uploadUserCertificate(
      imageBuffer,
      'svg',
      'certificates',
      process.env.AWS_PUBLIC_BUCKET_NAME,
      'base64',
      'certificates'
    );
    const existCredentialId = await this.userRepository.getUserCredentialsById(shareUserCertificate.credentialId);
    
    if (existCredentialId) {
      return `${process.env.FRONT_END_URL}/certificates/${shareUserCertificate.credentialId}`;
    }

    const saveCredentialData = await this.saveCertificateUrl(imageUrl, shareUserCertificate.credentialId);

    if (!saveCredentialData) {
      throw new BadRequestException(ResponseMessages.schema.error.notStoredCredential);
    }

    return `${process.env.FRONT_END_URL}/certificates/${shareUserCertificate.credentialId}`;

  }

  async saveCertificateUrl(imageUrl: string, credentialId: string): Promise<unknown> {
    return this.userRepository.saveCertificateImageUrl(imageUrl, credentialId);
  }

  async convertHtmlToImage(template: string, credentialId: string, option?: IPuppeteerOption): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      protocolTimeout: 800000, //initial - 200000
      headless: true
    });

    const options: IPuppeteerOption = (option && 0 < Object.keys(option).length) ? option : {width: 0, height: 1000};
    
    const page = await browser.newPage();
    await page.setViewport({ width: options?.width, height: options?.height, deviceScaleFactor: 2});
    await page.setContent(template);
    const screenshot = await page.screenshot();
    await browser.close();
    return screenshot;
  }

  //Need to add interface
  async getShorteningURL(shareUserCertificate, attributeArray): Promise<unknown> {
    const urlObject = {
      schemaId: shareUserCertificate.schemaId,
      credDefId: shareUserCertificate.credDefId,
      attribute: attributeArray,
      credentialId:shareUserCertificate.credentialId,
      email:attributeArray.find((attr) => 'email' in attr).email
    };

    const qrCodeOptions = { type: 'image/png' };
    const encodedData = Buffer.from(JSON.stringify(shareUserCertificate)).toString('base64');
      const qrCode = await QRCode.toDataURL(`https://credebl.id/c_v?${encodedData}`, qrCodeOptions);

    return qrCode;
  }
  /**
   *
   * @param acceptRejectInvitation
   * @param userId
   * @param email
   * @returns
   */
  async fetchInvitationsStatus(
    acceptRejectInvitation: AcceptRejectInvitationDto,
    keycloakUserId: string,
    email: string,
    userId: string
  ): Promise<IUserInvitations> {
    try {
      const pattern = { cmd: 'update-invitation-status' };

      const { orgId, invitationId, status } = acceptRejectInvitation;

      const payload = { userId, keycloakUserId, orgId, invitationId, status, email };

      const invitationsData = await this.userServiceProxy
        .send(pattern, payload)
        .toPromise()
        .catch((error) => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              statusCode: error.statusCode,
              error: error.error,
              message: error.message
            },
            error.error
          );
        });

      return invitationsData;
    } catch (error) {
      this.logger.error(`Error In fetchInvitationsStatus: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param orgId
   * @returns users list
   */
  async getOrgUsers(orgId: string, pageNumber: number, pageSize: number, search: string): Promise<IOrgUsers> {
    try {
  
      const query = {
        userOrgRoles: {
          some: { orgId }
        },
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };

      const filterOptions = {
        orgId
      };

      return this.userRepository.findOrgUsers(query, pageNumber, pageSize, filterOptions);
    } catch (error) {
      this.logger.error(`get Org Users: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param orgId
   * @returns users list
   */
  async get(pageNumber: number, pageSize: number, search: string): Promise<object> {
    try {
      const query = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };

      return this.userRepository.findUsers(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`get Users: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async checkUserExist(email: string): Promise<ICheckUserDetails> {
    try {
      const userDetails = await this.userRepository.checkUniqueUserExist(email.toLowerCase());
      if (userDetails && !userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.verificationAlreadySent);
      } else if (userDetails && userDetails.keycloakUserId) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      } else if (userDetails && !userDetails.keycloakUserId && userDetails.supabaseUserId) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      } else if (null === userDetails) {
        return {
          isRegistrationCompleted: false,
          isEmailVerified: false
        };
      } else {
        const userVerificationDetails = {
          isEmailVerified: userDetails.isEmailVerified,
          isFidoVerified: userDetails.isFidoVerified,
          isRegistrationCompleted: null !== userDetails.keycloakUserId && undefined !== userDetails.keycloakUserId

        };
        return userVerificationDetails;
      }
    } catch (error) {
      this.logger.error(`In check User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getUserActivity(userId: string, limit: number): Promise<IUsersActivity[]> {
    try {
      return this.userActivityService.getUserActivity(userId, limit);
    } catch (error) {
      this.logger.error(`In getUserActivity : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  // eslint-disable-next-line camelcase
  async updatePlatformSettings(platformSettings: PlatformSettings): Promise<string> {
    try {
      const platformConfigSettings = await this.userRepository.updatePlatformSettings(platformSettings);

      if (!platformConfigSettings) {
        throw new BadRequestException(ResponseMessages.user.error.notUpdatePlatformSettings);
      }

      const ecosystemobj = {};

      if (EcosystemConfigSettings.ENABLE_ECOSYSTEM in platformSettings) {
        ecosystemobj[EcosystemConfigSettings.ENABLE_ECOSYSTEM] = platformSettings.enableEcosystem;
      }

      if (EcosystemConfigSettings.MULTI_ECOSYSTEM in platformSettings) {
        ecosystemobj[EcosystemConfigSettings.MULTI_ECOSYSTEM] = platformSettings.multiEcosystemSupport;
      }

      const eosystemKeys = Object.keys(ecosystemobj);

      if (0 === eosystemKeys.length) {
        return ResponseMessages.user.success.platformEcosystemettings;
      }

      const ecosystemSettings = await this.userRepository.updateEcosystemSettings(eosystemKeys, ecosystemobj);

      if (!ecosystemSettings) {
        throw new BadRequestException(ResponseMessages.user.error.notUpdateEcosystemSettings);
      }

      return ResponseMessages.user.success.platformEcosystemettings;
    } catch (error) {
      this.logger.error(`update platform settings: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getPlatformEcosystemSettings(): Promise<object> {
    try {
      const platformSettings = {};
      const platformConfigSettings = await this.userRepository.getPlatformSettings();

      if (!platformConfigSettings) {
        throw new BadRequestException(ResponseMessages.user.error.platformSetttingsNotFound);
      }

      const ecosystemConfigSettings = await this.userRepository.getEcosystemSettings();

      if (!ecosystemConfigSettings) {
        throw new BadRequestException(ResponseMessages.user.error.ecosystemSetttingsNotFound);
      }

      platformSettings['platform_config'] = platformConfigSettings;
      platformSettings['ecosystem_config'] = ecosystemConfigSettings;

      return platformSettings;
    } catch (error) {
      this.logger.error(`update platform settings: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async updateOrgDeletedActivity(orgId: string, userId: string, deletedBy: string, recordType: RecordType, userEmail: string, txnMetadata: object): Promise<IUserDeletedActivity> {
    try {
      return await this.userRepository.updateOrgDeletedActivity(orgId, userId, deletedBy, recordType, userEmail, txnMetadata);
    } catch (error) {
      this.logger.error(`In updateOrgDeletedActivity : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<string> {
    try {
      const getUserDetails = await this.userRepository.getUserDetailsByUserId(userId);
      const userEmail = getUserDetails.email;
      return userEmail;
    } catch (error) {
      this.logger.error(`In get user details by user Id : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getUserKeycloakIdByEmail(userEmails: string[]): Promise<UserKeycloakId[]> {
    try {
     
      const getkeycloakUserIds = await this.userRepository.getUserKeycloak(userEmails);
      return getkeycloakUserIds;
    } catch (error) {
      this.logger.error(`In getUserKeycloakIdByEmail : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getUserByUserIdInKeycloak(email: string): Promise<string> {
    try {
      const userData = await this.userRepository.checkUserExist(email.toLowerCase());

      if (!userData) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      const token = await this.clientRegistrationService.getManagementToken(userData?.clientId, userData?.clientSecret);
      const getClientData = await this.clientRegistrationService.getUserInfoByUserId(userData?.keycloakUserId, token);

      return getClientData;
    } catch (error) {
      this.logger.error(`In getUserByUserIdInKeycloak : ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
