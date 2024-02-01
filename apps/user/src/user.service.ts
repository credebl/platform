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

import * as fs from 'fs';
// import bcrypt = require('bcrypt');

import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonService } from '@credebl/common';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
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
import { user } from '@prisma/client';
import {
  Attribute,
  ICheckUserDetails,
  OrgInvitations,
  PlatformSettings,
  IShareUserCertificate,
  IOrgUsers,
  InvitationsI,
  PlatformSettingsI,
  ShareUserCertificateI,
  UpdateUserProfile,
  IUserCredentials, 
   IUserInformation,
    IUsersProfile,
    IUserResetPassword
} from '../interfaces/user.interface';
import { AcceptRejectInvitationDto } from '../dtos/accept-reject-invitation.dto';
import { UserActivityService } from '@credebl/user-activity';
import { SupabaseService } from '@credebl/supabase';
import { UserDevicesRepository } from '../repositories/user-device.repository';
import { v4 as uuidv4 } from 'uuid';
import { EcosystemConfigSettings, UserCertificateId } from '@credebl/enum/enum';
import { WinnerTemplate } from '../templates/winner-template';
import { ParticipantTemplate } from '../templates/participant-template';
import { ArbiterTemplate } from '../templates/arbiter-template';
import validator from 'validator';
import { DISALLOWED_EMAIL_DOMAIN } from '@credebl/common/common.constant';
import { AwsService } from '@credebl/aws';
import puppeteer from 'puppeteer';
import { WorldRecordTemplate } from '../templates/world-record-template';
import { IUsersActivity } from 'libs/user-activity/interface';
import { ISendVerificationEmail, ISignInUser, IVerifyUserEmail, IUserInvitations, IResetPasswordResponse } from '@credebl/common/interfaces/user.interface';
import { AddPasskeyDetailsDto } from 'apps/api-gateway/src/user/dto/add-user.dto';

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
      const { email } = userEmailVerification;

      if ('PROD' === process.env.PLATFORM_PROFILE_MODE) {
        // eslint-disable-next-line prefer-destructuring
        const domain = email.split('@')[1];

        if (DISALLOWED_EMAIL_DOMAIN.includes(domain)) {
          throw new BadRequestException(ResponseMessages.user.error.InvalidEmailDomain);
        }
      }
      const userDetails = await this.userRepository.checkUserExist(email);

      if (userDetails?.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      }

      if (userDetails && !userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.verificationAlreadySent);
      }

      const verifyCode = uuidv4();
      const uniqueUsername = await this.createUsername(email, verifyCode);
      userEmailVerification.username = uniqueUsername;
      const resUser = await this.userRepository.createUser(userEmailVerification, verifyCode);

      try {
        await this.sendEmailForVerification(email, resUser.verificationCode);
      } catch (error) {
        throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
      }

      return resUser;
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

  async sendEmailForVerification(email: string, verificationCode: string): Promise<boolean> {
    try {
      const platformConfigData = await this.prisma.platform_config.findMany();

      const urlEmailTemplate = new URLUserEmailTemplate();
      const emailData = new EmailDto();
      emailData.emailFrom = platformConfigData[0].emailFrom;
      emailData.emailTo = email;
      emailData.emailSubject = `[${process.env.PLATFORM_NAME}] Verify your email to activate your account`;

      emailData.emailHtml = await urlEmailTemplate.getUserURLTemplate(email, verificationCode);
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

  async createUserForToken(userInfo: IUserInformation): Promise<string> {
    try {
      const { email } = userInfo;
      if (!userInfo.email) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
      }
      const checkUserDetails = await this.userRepository.getUserDetails(userInfo.email.toLowerCase());

      if (!checkUserDetails) {
        throw new NotFoundException(ResponseMessages.user.error.emailIsNotVerified);
      }
      if (checkUserDetails.supabaseUserId) {
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

      const token = await this.clientRegistrationService.getManagementToken();

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

      const holderRoleData = await this.orgRoleService.getRole(OrgRoles.HOLDER);
      await this.userOrgRoleService.createUserOrgRole(userDetails.id, holderRoleData.id);

      return ResponseMessages.user.success.signUpUser;
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
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

      const decryptedPassword = await this.commonService.decryptPassword(oldPassword);
      const tokenResponse = this.generateToken(email.toLowerCase(), decryptedPassword, userData);

      if (tokenResponse) {
        const decryptedNewPassword = await this.commonService.decryptPassword(newPassword);
        userData.password = decryptedNewPassword;
        try {    
          let keycloakDetails = null;    
          const token = await this.clientRegistrationService.getManagementToken();  
          keycloakDetails = await this.clientRegistrationService.createUser(userData, process.env.KEYCLOAK_REALM, token);

          const userDetails = await this.userRepository.updateUserDetails(userData.id,
            keycloakDetails.keycloakUserId.toString()
          );

          return {
            id: userDetails.id,
            email: userDetails.email
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
    try {

      if (userData.keycloakUserId) {
        const tokenResponse = await this.clientRegistrationService.getUserToken(email, password);
        tokenResponse.isRegisteredToSupabase = false;
        return tokenResponse;
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
    } catch (error) {
      throw new BadRequestException(error?.message);
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

      if ('true' === ecosystemDetails.value) {
        userData['enableEcosystem'] = true;
        return userData;
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
      return this.fetchInvitationsStatus(acceptRejectInvitation, userId, userData.email);
    } catch (error) {
      this.logger.error(`acceptRejectInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async shareUserCertificate(shareUserCertificate: IShareUserCertificate): Promise<string> {

    const attributeArray = [];
    let attributeJson = {};
    const attributePromises = shareUserCertificate.attributes.map(async (iterator: Attribute) => {
      attributeJson = {
        [iterator.name]: iterator.value
      };
      attributeArray.push(attributeJson);
    });
    await Promise.all(attributePromises);
    let template;

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
      default:
        throw new NotFoundException('error in get attributes');
    }

    const option: IPuppeteerOption = {height: 0, width: 1000};

    const imageBuffer = 
    await this.convertHtmlToImage(template, shareUserCertificate.credentialId, option);
    const verifyCode = uuidv4();

    const imageUrl = await this.awsService.uploadUserCertificate(
      imageBuffer,
      'svg',
      'certificates',
      process.env.AWS_PUBLIC_BUCKET_NAME,
      'base64'
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
      protocolTimeout: 200000,
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

  /**
   *
   * @param acceptRejectInvitation
   * @param userId
   * @param email
   * @returns
   */
  async fetchInvitationsStatus(
    acceptRejectInvitation: AcceptRejectInvitationDto,
    userId: string,
    email: string
  ): Promise<IUserInvitations> {
    try {
      const pattern = { cmd: 'update-invitation-status' };

      const { orgId, invitationId, status } = acceptRejectInvitation;

      const payload = { userId, orgId, invitationId, status, email };

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
      } else if (userDetails && userDetails.supabaseUserId) {
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
          isRegistrationCompleted: null !== userDetails.supabaseUserId && undefined !== userDetails.supabaseUserId

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

  async registerKeycloakUsers(): Promise<string> {
    try {

      const configData = fs.readFileSync(`${process.cwd()}/apps/user/json-data/supabase-user-data.json`, 'utf8');

      const token = await this.clientRegistrationService.getManagementToken();

      const { supabaseUsers } = JSON.parse(configData);

      for (const user of supabaseUsers) {

        const payload = {
          email: user.email,
          username: user.email,
          emailVerified: true,
          enabled: true
        };

        const createdUser = await this.clientRegistrationService.createUsersInKeycloak(payload, process.env.KEYCLOAK_REALM, token, user.encrypted_password);

        if (createdUser) {

          const userData = await this.userRepository.checkUserExist(user.email.toLowerCase());

          await this.userRepository.updateUserDetails(userData.id,
            createdUser.keycloakUserId.toString()
          );    
        }
      }

      return 'Users registered to keycloak';
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
}
