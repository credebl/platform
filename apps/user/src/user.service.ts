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
  AddPasskeyDetails,
  InvitationsI,
  PlatformSettingsI,
  UpdateUserProfile,
  UserEmailVerificationDto,
  UserI,
  userInfo
} from '../interfaces/user.interface';
import { AcceptRejectInvitationDto } from '../dtos/accept-reject-invitation.dto';
import { UserActivityService } from '@credebl/user-activity';
import { SupabaseService } from '@credebl/supabase';
import { UserDevicesRepository } from '../repositories/user-device.repository';
import { v4 as uuidv4 } from 'uuid';
import { EcosystemConfigSettings } from '@credebl/enum/enum';
import validator from 'validator';
import { DISALLOWED_EMAIL_DOMAIN } from '@credebl/common/common.constant';
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
    private readonly userDevicesRepository: UserDevicesRepository,
    private readonly logger: Logger,
    @Inject('NATS_CLIENT') private readonly userServiceProxy: ClientProxy
  ) {}

  /**
   *
   * @param userEmailVerificationDto
   * @returns
   */
  async sendVerificationMail(userEmailVerificationDto: UserEmailVerificationDto): Promise<user> {
    try {
      const { email } = userEmailVerificationDto;

      if ('PROD' === process.env.PLATFORM_PROFILE_MODE) {
        // eslint-disable-next-line prefer-destructuring
        const domain = email.split('@')[1];

        if (DISALLOWED_EMAIL_DOMAIN.includes(domain)) {
          throw new BadRequestException(ResponseMessages.user.error.InvalidEmailDomain);
        }
      }
      const userDetails = await this.userRepository.checkUserExist(userEmailVerificationDto.email);

      if (userDetails && userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      }

      if (userDetails && !userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.verificationAlreadySent);
      }

      const verifyCode = uuidv4();
      const uniqueUsername = await this.createUsername(userEmailVerificationDto.email, verifyCode);
      userEmailVerificationDto.username = uniqueUsername;
      const resUser = await this.userRepository.createUser(userEmailVerificationDto, verifyCode);

      try {
        await this.sendEmailForVerification(userEmailVerificationDto.email, resUser.verificationCode);
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
      emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Email Verification`;

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

  async verifyEmail(param: VerifyEmailTokenDto): Promise<object> {
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
        await this.userRepository.verifyUser(param.email);
        return {
          message: 'User Verified sucessfully'
        };
      }
    } catch (error) {
      this.logger.error(`error in verifyEmail: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async createUserForToken(userInfo: userInfo): Promise<string> {
    try {
      const { email } = userInfo;
      if (!userInfo.email) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
      }
      const checkUserDetails = await this.userRepository.getUserDetails(userInfo.email);

      if (!checkUserDetails) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }
      if (checkUserDetails.supabaseUserId) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      }
      if (false === checkUserDetails.isEmailVerified) {
        throw new NotFoundException(ResponseMessages.user.error.verifyEmail);
      }
      const resUser = await this.userRepository.updateUserInfo(userInfo.email, userInfo);
      if (!resUser) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }
      const userDetails = await this.userRepository.getUserDetails(userInfo.email);
      if (!userDetails) {
        throw new NotFoundException(ResponseMessages.user.error.adduser);
      }

      let supaUser;

      if (userInfo.isPasskey) {
        const resUser = await this.userRepository.addUserPassword(email, userInfo.password);
        const userDetails = await this.userRepository.getUserDetails(email);
        const decryptedPassword = await this.commonService.decryptPassword(userDetails.password);

        if (!resUser) {
          throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
        }
        supaUser = await this.supabaseService.getClient().auth.signUp({
          email,
          password: decryptedPassword
        });
      } else {
        const decryptedPassword = await this.commonService.decryptPassword(userInfo.password);

        supaUser = await this.supabaseService.getClient().auth.signUp({
          email,
          password: decryptedPassword
        });
      }

      if (supaUser.error) {
        throw new InternalServerErrorException(supaUser.error?.message);
      }

      const supaId = supaUser.data?.user?.id;

      await this.userRepository.updateUserDetails(userDetails.id, supaId.toString());

      const holderRoleData = await this.orgRoleService.getRole(OrgRoles.HOLDER);
      await this.userOrgRoleService.createUserOrgRole(userDetails.id, holderRoleData.id);

      return 'User created successfully';
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async addPasskey(email: string, userInfo: AddPasskeyDetails): Promise<string> {
    try {
      if (!email) {
        throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
      }
      const checkUserDetails = await this.userRepository.getUserDetails(email);
      if (!checkUserDetails) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }
      if (!checkUserDetails.supabaseUserId) {
        throw new ConflictException(ResponseMessages.user.error.notFound);
      }
      if (false === checkUserDetails.isEmailVerified) {
        throw new NotFoundException(ResponseMessages.user.error.emailNotVerified);
      }
      const resUser = await this.userRepository.addUserPassword(email, userInfo.password);
      if (!resUser) {
        throw new NotFoundException(ResponseMessages.user.error.invalidEmail);
      }

      return 'User updated successfully';
    } catch (error) {
      this.logger.error(`Error in createUserForToken: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  private validateEmail(email: string): void {
    if (!validator.isEmail(email)) {
      throw new UnauthorizedException(ResponseMessages.user.error.invalidEmail);
    }
  }

  /**
   *
   * @param loginUserDto
   * @returns User access token details
   */
  async login(loginUserDto: LoginUserDto): Promise<object> {
    const { email, password, isPasskey } = loginUserDto;

      try {
         this.validateEmail(email);
        const userData = await this.userRepository.checkUserExist(email);
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
          const getUserDetails = await this.userRepository.getUserDetails(userData.email);
          const decryptedPassword = await this.commonService.decryptPassword(getUserDetails.password);
          return this.generateToken(email, decryptedPassword);
        } else {
          const decryptedPassword = await this.commonService.decryptPassword(password);
          return this.generateToken(email, decryptedPassword);
        }
      } catch (error) {
        this.logger.error(`In Login User : ${JSON.stringify(error)}`);
        throw new RpcException(error.response ? error.response : error);
      }
    
   
  }

  async generateToken(email: string, password: string): Promise<object> {
    try {
      const supaInstance = await this.supabaseService.getClient();
      this.logger.error(`supaInstance::`, supaInstance);

      const { data, error } = await supaInstance.auth.signInWithPassword({
        email,
        password
      });

      this.logger.error(`Supa Login Error::`, JSON.stringify(error));

      if (error) {
        throw new BadRequestException(error?.message);
      }

      const token = data?.session;
      return token;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getProfile(payload: { id }): Promise<object> {
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

  async getPublicProfile(payload: { username }): Promise<UserI> {
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

  async findUserByEmail(payload: { email }): Promise<object> {
    try {
      return await this.userRepository.findUserByEmail(payload.email);
    } catch (error) {
      this.logger.error(`findUserByEmail: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async invitations(payload: { id; status; pageNumber; pageSize; search }): Promise<object> {
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

      const invitations: InvitationsI[] = await this.updateOrgInvitations(invitationsData['invitations']);
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
  ): Promise<object> {
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

  async updateOrgInvitations(invitations: InvitationsI[]): Promise<InvitationsI[]> {
    const updatedInvitations = [];

    for (const invitation of invitations) {
      const { status, id, organisation, orgId, userId, orgRoles } = invitation;

      const roles = await this.orgRoleService.getOrgRolesByIds(orgRoles as number[]);

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
  async acceptRejectInvitations(acceptRejectInvitation: AcceptRejectInvitationDto, userId: number): Promise<string> {
    try {
      const userData = await this.userRepository.getUserById(userId);
      return this.fetchInvitationsStatus(acceptRejectInvitation, userId, userData.email);
    } catch (error) {
      this.logger.error(`acceptRejectInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
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
    userId: number,
    email: string
  ): Promise<string> {
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
              error: error.message
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
  async getOrgUsers(orgId: number, pageNumber: number, pageSize: number, search: string): Promise<object> {
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

  async checkUserExist(email: string): Promise<string | object> {
    try {
      const userDetails = await this.userRepository.checkUniqueUserExist(email);
      if (userDetails && !userDetails.isEmailVerified) {
        throw new ConflictException(ResponseMessages.user.error.verificationAlreadySent);
      } else if (userDetails && userDetails.supabaseUserId) {
        throw new ConflictException(ResponseMessages.user.error.exists);
      } else if (null === userDetails) {
        return {
          isExist: false
        };
      } else {
        const userVerificationDetails = {
          isEmailVerified: userDetails.isEmailVerified,
          isFidoVerified: userDetails.isFidoVerified,
          isSupabase: null !== userDetails.supabaseUserId && undefined !== userDetails.supabaseUserId,
          isExist: true
        };
        return userVerificationDetails;
      }
    } catch (error) {
      this.logger.error(`In check User : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getUserActivity(userId: number, limit: number): Promise<object[]> {
    try {
      return this.userActivityService.getUserActivity(userId, limit);
    } catch (error) {
      this.logger.error(`In getUserActivity : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  // eslint-disable-next-line camelcase
  async updatePlatformSettings(platformSettings: PlatformSettingsI): Promise<string> {
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
