/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import {
  IOrgUsers,
  IRestrictedUserSession,
  ISendVerificationEmail,
  ISession,
  IShareUserCertificate,
  ITokenData,
  IUserDeletedActivity,
  IUserInformation,
  IUsersProfile,
  IVerifyUserEmail,
  PlatformSettings,
  UpdateUserProfile,
  UserKeycloakId,
  UserRoleDetails,
  UserRoleMapping
} from '../interfaces/user.interface';
import {
  Prisma,
  RecordType,
  account,
  client_aliases,
  schema,
  session,
  token,
  user,
  user_org_roles
} from '@prisma/client';
import { ProviderType, UserRole } from '@credebl/enum/enum';

import { PrismaService } from '@credebl/prisma-service';
import { RpcException } from '@nestjs/microservices';

interface UserQueryOptions {
  id?: string; // Use the appropriate type based on your data model
  email?: string; // Use the appropriate type based on your data model
  username?: string;
  // Add more properties if needed for other unique identifier fields
}

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   *
   * @returns Client alias and its url
   */

  // eslint-disable-next-line camelcase
  async fetchClientAliases(): Promise<client_aliases[]> {
    try {
      return this.prisma.client_aliases.findMany();
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @param userEmailVerification
   * @returns user's email
   */
  async createUser(userEmailVerification: ISendVerificationEmail, verifyCode: string): Promise<user> {
    try {
      const saveResponse = await this.prisma.user.upsert({
        where: {
          email: userEmailVerification.email
        },
        create: {
          username: userEmailVerification.username,
          email: userEmailVerification.email,
          verificationCode: verifyCode.toString(),
          clientId: userEmailVerification.clientId,
          clientSecret: userEmailVerification.clientSecret,
          publicProfile: true
        },
        update: {
          verificationCode: verifyCode.toString()
        }
      });

      return saveResponse;
    } catch (error) {
      this.logger.error(`In Create User Repository: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @param email
   * @returns User exist details
   */

  // eslint-disable-next-line camelcase
  async checkUserExist(email: string): Promise<user> {
    try {
      return this.prisma.user.findFirst({
        where: {
          email
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new error();
    }
  }

  /**
   *
   * @param email
   * @returns User details
   */
  async getUserDetails(email: string): Promise<user> {
    try {
      return this.prisma.user.findFirst({
        where: {
          email
        }
      });
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
   *
   * @param sessionId
   * @returns Session details
   */
  async getSession(sessionId: string): Promise<session> {
    try {
      return await this.prisma.session.findUnique({
        where: {
          id: sessionId
        }
      });
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  async validateSession(sessionId: string): Promise<object> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });
    return session;
  }

  /**
   *
   * @param id
   * @returns User profile data
   */
  async getUserById(id: string): Promise<IUsersProfile> {
    const queryOptions: UserQueryOptions = {
      id
    };

    return this.findUser(queryOptions);
  }

  /**
   *
   * @param id
   * @returns User profile data
   */
  async getUserPublicProfile(username: string): Promise<IUsersProfile> {
    const queryOptions: UserQueryOptions = {
      username
    };

    return this.findUserForPublicProfile(queryOptions);
  }

  /**
   *
   * @body updateUserProfile
   * @returns Update user profile data
   */
  async updateUserProfile(updateUserProfile: UpdateUserProfile): Promise<user> {
    try {
      const userdetails = await this.prisma.user.update({
        where: {
          id: String(updateUserProfile.id)
        },
        data: {
          profileImg: updateUserProfile.profileImg,
          firstName: updateUserProfile.firstName,
          lastName: updateUserProfile.lastName,
          publicProfile: updateUserProfile?.isPublic
        }
      });
      return userdetails;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @param id
   * @returns User data
   */
  async getUserBySupabaseId(id: string): Promise<object> {
    try {
      return this.prisma.user.findFirst({
        where: {
          supabaseUserId: id
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
          clientId: true,
          clientSecret: true,
          supabaseUserId: true,
          userOrgRoles: {
            include: {
              orgRole: true,
              organisation: {
                include: {
                  // eslint-disable-next-line camelcase
                  org_agents: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
   *
   * @param id
   * @returns
   */
  async getUserByKeycloakId(id: string): Promise<object> {
    try {
      return this.prisma.user.findFirstOrThrow({
        where: {
          keycloakUserId: id
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
          clientId: true,
          clientSecret: true,
          supabaseUserId: true,
          keycloakUserId: true,
          userOrgRoles: {
            include: {
              orgRole: true,
              organisation: {
                include: {
                  // eslint-disable-next-line camelcase
                  org_agents: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`error in getUserByKeycloakId: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<object> {
    const queryOptions: UserQueryOptions = {
      email
    };
    return this.findUser(queryOptions);
  }

  async findUser(queryOptions: UserQueryOptions): Promise<IUsersProfile> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          {
            id: queryOptions.id
          },
          {
            email: queryOptions.email
          }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImg: true,
        publicProfile: true,
        supabaseUserId: true,
        keycloakUserId: true,
        isEmailVerified: true,
        userOrgRoles: {
          select: {
            id: true,
            userId: true,
            orgRoleId: true,
            orgId: true,
            orgRole: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            organisation: {
              select: {
                id: true,
                name: true,
                description: true,
                orgSlug: true,
                logoUrl: true,
                website: true,
                publicProfile: true,
                countryId: true,
                stateId: true,
                cityId: true
              }
            }
          }
        }
      }
    });
  }

  async findUserForPublicProfile(queryOptions: UserQueryOptions): Promise<IUsersProfile> {
    return this.prisma.user.findFirst({
      where: {
        publicProfile: true,
        OR: [
          {
            id: String(queryOptions.id)
          },
          {
            email: queryOptions.email
          },
          {
            username: queryOptions.username
          }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        publicProfile: true,
        userOrgRoles: {
          select: {
            id: true,
            userId: true,
            orgRoleId: true,
            orgId: true,
            orgRole: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            organisation: {
              select: {
                id: true,
                name: true,
                description: true,
                orgSlug: true,
                logoUrl: true,
                website: true,
                publicProfile: true,
                countryId: true,
                stateId: true,
                cityId: true
              }
            }
          }
        }
      }
    });
  }

  /**
   *
   * @param tenantDetails
   * @returns Updates organization details
   */
  // eslint-disable-next-line camelcase
  async updateUserDetails(id: string, keycloakId: string): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          id
        },
        data: {
          isEmailVerified: true,
          keycloakUserId: keycloakId
        }
      });
      return updateUserDetails;
    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @param userInfo
   * @returns Updates user details
   */
  // eslint-disable-next-line camelcase
  async updateUserInfo(email: string, userInfo: IUserInformation): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          email
        },
        data: {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        }
      });
      return updateUserDetails;
    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @param queryOptions
   * @param filterOptions
   * @returns users list
   */
  async findOrgUsers(
    queryOptions: object,
    pageNumber: number,
    pageSize: number,
    filterOptions?: object
  ): Promise<IOrgUsers> {
    const result = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          ...queryOptions // Spread the dynamic condition object
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
          userOrgRoles: {
            where: {
              ...filterOptions
              // Additional filtering conditions if needed
            },
            select: {
              id: true,
              orgId: true,
              orgRoleId: true,
              orgRole: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              },
              organisation: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  orgSlug: true,
                  logoUrl: true,
                  // eslint-disable-next-line camelcase
                  org_agents: {
                    select: {
                      id: true,
                      orgDid: true,
                      walletName: true,
                      agentSpinUpStatus: true,
                      agentsTypeId: true,
                      createDateTime: true,
                      orgAgentTypeId: true
                    }
                  }
                }
              }
            }
          }
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
        orderBy: {
          createDateTime: 'desc'
        }
      }),
      this.prisma.user.count({
        where: {
          ...queryOptions
        }
      })
    ]);

    const users = result[0];
    const totalCount = result[1];
    const totalPages = Math.ceil(totalCount / pageSize);

    return { totalPages, users };
  }

  /**
   *
   * @param queryOptions
   * @param filterOptions
   * @returns users list
   */
  async findUsers(queryOptions: object, pageNumber: number, pageSize: number): Promise<object> {
    const result = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          ...queryOptions, // Spread the dynamic condition object
          publicProfile: true
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImg: true,
          isEmailVerified: true,
          clientId: false,
          clientSecret: false,
          supabaseUserId: false
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
        orderBy: {
          createDateTime: 'desc'
        }
      }),
      this.prisma.user.count({
        where: {
          ...queryOptions
        }
      })
    ]);

    const users = result[0];
    const totalCount = result[1];
    const totalPages = Math.ceil(totalCount / pageSize);

    return { totalPages, users };
  }

  async getAttributesBySchemaId(shareUserCertificate: IShareUserCertificate): Promise<schema> {
    try {
      const getAttributes = await this.prisma.schema.findFirst({
        where: {
          schemaLedgerId: shareUserCertificate.schemaId
        }
      });
      return getAttributes;
    } catch (error) {
      this.logger.error(`checkSchemaExist:${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async checkUniqueUserExist(email: string): Promise<user> {
    try {
      return this.prisma.user.findUnique({
        where: {
          email
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async verifyUser(email: string): Promise<IVerifyUserEmail> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          email
        },
        data: {
          isEmailVerified: true
        }
      });
      return updateUserDetails;
    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @param userInfo
   * @returns Updates user credentials
   */
  // eslint-disable-next-line camelcase
  async addUserPassword(email: string, userInfo: string): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          email
        },
        data: {
          password: userInfo
        }
      });
      return updateUserDetails;
    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @param userId
   * @param token
   * @param expireTime
   * @returns token details
   */
  async createTokenForResetPassword(userId: string, token: string, expireTime: Date): Promise<token> {
    try {
      const createResetPasswordToken = await this.prisma.token.create({
        data: {
          token,
          userId,
          expiresAt: expireTime
        }
      });
      return createResetPasswordToken;
    } catch (error) {
      this.logger.error(`Error in createTokenForResetPassword: ${error.message} `);
      throw error;
    }
  }

  async createSession(tokenDetails: ISession): Promise<session> {
    try {
      const { sessionToken, userId, expires, refreshToken, accountId, sessionType, expiresAt } = tokenDetails;
      const sessionResponse = await this.prisma.session.create({
        data: {
          id: tokenDetails.id,
          sessionToken,
          expires,
          userId,
          refreshToken,
          accountId,
          sessionType,
          expiresAt,
          ...(tokenDetails.clientInfo ? { clientInfo: tokenDetails.clientInfo } : { clientInfo: { clientToken: true } })
        }
      });
      return sessionResponse;
    } catch (error) {
      this.logger.error(`Error in creating session: ${error.message} `);
      throw error;
    }
  }

  async fetchUserSessions(userId: string): Promise<IRestrictedUserSession[]> {
    try {
      const userSessionCount = await this.prisma.session.findMany({
        where: {
          userId
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          createdAt: true,
          clientInfo: true,
          sessionType: true
        }
      });
      return userSessionCount;
    } catch (error) {
      this.logger.error(`Error in getting user session details: ${error.message} `);
      throw error;
    }
  }

  //this function is to fetch all session details for a user including token details without any restriction
  async fetchUserSessionDetails(userId: string): Promise<ISession[]> {
    try {
      const userSessionCount = await this.prisma.session.findMany({
        where: {
          userId
        }
      });
      return userSessionCount;
    } catch (error) {
      this.logger.error(`Error in getting user session details: ${error.message} `);
      throw error;
    }
  }

  async checkAccountDetails(userId: string): Promise<account> {
    try {
      const accountDetails = await this.prisma.account.findUnique({
        where: {
          userId
        }
      });
      return accountDetails;
    } catch (error) {
      this.logger.error(`Error in getting account details: ${error.message} `);
      throw error;
    }
  }

  async addAccountDetails(accountDetails: ISession): Promise<account> {
    try {
      const userAccountDetails = await this.prisma.account.create({
        data: {
          userId: accountDetails.userId,
          provider: ProviderType.KEYCLOAK,
          providerAccountId: accountDetails.keycloakUserId,
          tokenType: accountDetails.type
        }
      });
      return userAccountDetails;
    } catch (error) {
      this.logger.error(`Error in creating account: ${error.message}`);
      throw error;
    }
  }

  /**
   *
   * @param userId
   * @param token
   * @returns reset password token details
   */
  async getResetPasswordTokenDetails(userId: string, token: string): Promise<token> {
    try {
      const tokenDetails = await this.prisma.token.findUnique({
        where: {
          userId,
          token
        }
      });
      return tokenDetails;
    } catch (error) {
      this.logger.error(`Error in getResetPasswordTokenDetails: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @param id
   * @returns token delete records
   */
  async deleteResetPasswordToken(id: string): Promise<token> {
    try {
      const tokenDeleteDetails = await this.prisma.token.delete({
        where: {
          id
        }
      });
      return tokenDeleteDetails;
    } catch (error) {
      this.logger.error(`Error in deleteResetPasswordToken: ${error.message} `);
      throw error;
    }
  }

  /**
   *
   * @body updatePlatformSettings
   * @returns Update platform settings
   */
  async updatePlatformSettings(updatePlatformSettings: PlatformSettings): Promise<object> {
    try {
      const getPlatformDetails = await this.prisma.platform_config.findFirst();
      const platformDetails = await this.prisma.platform_config.update({
        where: {
          id: getPlatformDetails.id
        },
        data: {
          externalIp: updatePlatformSettings.externalIp,
          inboundEndpoint: updatePlatformSettings.inboundEndpoint,
          sgApiKey: updatePlatformSettings.sgApiKey,
          emailFrom: updatePlatformSettings.emailFrom,
          apiEndpoint: updatePlatformSettings.apiEndPoint
        }
      });

      return platformDetails;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getPlatformSettings(): Promise<object> {
    try {
      const getPlatformSettingsList = await this.prisma.platform_config.findMany();
      return getPlatformSettingsList;
    } catch (error) {
      this.logger.error(`error in getPlatformSettings: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async updateOrgDeletedActivity(
    orgId: string,
    userId: string,
    deletedBy: string,
    recordType: RecordType,
    userEmail: string,
    txnMetadata: object
  ): Promise<IUserDeletedActivity> {
    try {
      const orgDeletedActivity = await this.prisma.user_org_delete_activity.create({
        data: {
          orgId,
          userEmail,
          deletedBy,
          recordType,
          txnMetadata,
          userId
        }
      });
      return orgDeletedActivity;
    } catch (error) {
      this.logger.error(`Error in updateOrgDeletedActivity: ${error} `);
      throw error;
    }
  }

  async getUserDetailsByUserId(userId: string): Promise<{
    email: string;
  }> {
    try {
      const getUserDetails = await this.prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
          email: true
        }
      });
      return getUserDetails;
    } catch (error) {
      this.logger.error(`Error in getting user details: ${error} `);
      throw error;
    }
  }

  async getUserKeycloak(userEmails: string[]): Promise<UserKeycloakId[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          email: {
            in: userEmails
          }
        },
        select: {
          email: true,
          keycloakUserId: true,
          id: true
        }
      });

      // Create a map for quick lookup of keycloakUserId, id, and email by email
      const userMap = new Map(
        users.map((user) => [user.email, { id: user.id, keycloakUserId: user.keycloakUserId, email: user.email }])
      );

      // Collect the keycloakUserId, id, and email in the order of input emails
      const result = userEmails.map((email) => {
        const user = userMap.get(email);
        return { id: user?.id || null, keycloakUserId: user?.keycloakUserId || null, email };
      });

      return result;
    } catch (error) {
      this.logger.error(`Error in getUserKeycloak: ${error}`);
      throw error;
    }
  }

  async storeUserRole(userId: string, userRoleId: string): Promise<UserRoleMapping> {
    try {
      const userRoleMapping = await this.prisma.user_role_mapping.create({
        data: {
          userId,
          userRoleId
        }
      });
      return userRoleMapping;
    } catch (error) {
      this.logger.error(`Error in storeUserRole: ${error.message} `);
      throw error;
    }
  }

  async getUserRole(role: UserRole): Promise<UserRoleDetails> {
    try {
      const getUserRole = await this.prisma.user_role.findFirstOrThrow({
        where: {
          role
        }
      });
      return getUserRole;
    } catch (error) {
      this.logger.error(`Error in getUserRole: ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async handleGetUserOrganizations(userId: string): Promise<user_org_roles[]> {
    try {
      const getUserOrgs = await this.prisma.user_org_roles.findMany({
        where: {
          userId
        }
      });

      return getUserOrgs;
    } catch (error) {
      this.logger.error(`Error in handleGetUserOrganizations: ${error.message}`);
      throw error;
    }
  }

  async destroySession(sessions: string[]): Promise<Prisma.BatchPayload> {
    try {
      const userSessions = await this.prisma.session.deleteMany({
        where: {
          id: {
            in: sessions
          }
        }
      });

      return userSessions;
    } catch (error) {
      this.logger.error(`Error in logging out user: ${error.message}`);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<session> {
    try {
      const userSession = await this.prisma.session.delete({
        where: {
          id: sessionId
        }
      });
      return userSession;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && 'P2025' === error.code) {
        this.logger.warn(`Session not found for deletion: ${sessionId}`);
        throw new NotFoundException('Record to be deleted not found');
      } else {
        this.logger.error(`Error in logging out user: ${error.message}`);
        throw error;
      }
    }
  }

  async deleteSessionBySessionId(sessionId: string, userId: string): Promise<{ message: string }> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId, userId }
      });

      return { message: 'Session deleted successfully' };
    } catch (error) {
      if ('P2025' === error.code) {
        throw new RpcException(new NotFoundException(`Session not found for userId: ${userId}`));
      }
      this.logger.error(`Error in Deleting Session: ${error.message}`);
      throw error;
    }
  }

  async fetchSessionByRefreshToken(refreshToken: string): Promise<session> {
    try {
      const sessionDetails = await this.prisma.session.findFirst({
        where: {
          refreshToken
        }
      });
      return sessionDetails;
    } catch (error) {
      this.logger.error(`Error in fetching session details::${error.message}`);
      throw error;
    }
  }

  async deleteInactiveSessions(userId: string): Promise<Prisma.BatchPayload> {
    try {
      const response = await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          userId
        }
      });
      this.logger.debug('Deleted inactive sessions::', response);
      return response;
    } catch (error) {
      this.logger.error(`Error in deleting the in active sessions::${error.message}`);
      throw error;
    }
  }

  async updateSessionToken(id: string, tokenData: ITokenData): Promise<session> {
    if (!id || !tokenData) {
      throw new BadRequestException(`Missing id or tokenData for session details update`);
    }
    try {
      const sessionResponse = await this.prisma.session.update({
        where: {
          id
        },
        data: tokenData
      });
      return sessionResponse;
    } catch (error) {
      this.logger.error(`Error in creating session: ${error.message} `);
      if (error instanceof Prisma.PrismaClientKnownRequestError && 'P2025' === error.code) {
        this.logger.warn(`Session not found for update: ${id}`);
        throw new NotFoundException('Session not found');
      }
      throw error;
    }
  }
}
