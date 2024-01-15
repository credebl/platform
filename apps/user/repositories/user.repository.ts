/* eslint-disable prefer-destructuring */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IOrgUsers,
  PlatformSettings,
  ShareUserCertificate,
  UpdateUserProfile,
  IUserCredentials,
  ISendVerificationEmail,
  IUsersProfile,
  IUserInformation, 
  IVerifyUserEmail
} from '../interfaces/user.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { schema, user } from '@prisma/client';

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
   * @param userEmailVerification
   * @returns user's email
   */
  async createUser(userEmailVerification:ISendVerificationEmail, verifyCode: string): Promise<user> {
    try {
      const saveResponse = await this.prisma.user.upsert({
        where: {
          email: userEmailVerification.email
        },
        create: {
          username: userEmailVerification.username,
          email: userEmailVerification.email,
          verificationCode: verifyCode.toString(),
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
      throw new error;
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
  async getUserCredentialsById(credentialId: string): Promise<IUserCredentials> {
    return this.prisma.user_credentials.findUnique({
      where: {
        credentialId
      }
    });
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
   * @Body updateUserProfile
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
        userOrgRoles: {
          select:{
            id: true,
            userId:true,
            orgRoleId:true,
            orgId:true,
            orgRole: {
              select:{
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
                orgSlug:true,
                logoUrl: true,
                website: true,
                publicProfile: true
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
          select:{
            id: true,
            userId:true,
            orgRoleId:true,
            orgId:true,
            orgRole: {
              select:{
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
                orgSlug:true,
                logoUrl: true,
                website: true,
                publicProfile: true
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
  async updateUserDetails(id: string, supabaseUserId: string): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          id
        },
        data: {
          isEmailVerified: true,
          supabaseUserId
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
                      orgAgentTypeId:true
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

  async getAttributesBySchemaId(shareUserCertificate: ShareUserCertificate): Promise<schema> {
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

  async saveCertificateImageUrl(imageUrl: string, credentialId: string): Promise<unknown> {
    try {
      const saveImageUrl = await this.prisma.user_credentials.create({
        data: {
          imageUrl,
          credentialId
        }
      });
      return saveImageUrl;
    } catch (error) {
      throw new Error(`Error saving certificate image URL: ${error.message}`);
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
   * @Body updatePlatformSettings
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
          lastInternalId: updatePlatformSettings.lastInternalId,
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

  /**
   *
   * @Body updatePlatformSettings
   * @returns Update ecosystem settings
   */
  async updateEcosystemSettings(eosystemKeys: string[], ecosystemObj: object): Promise<boolean> {
    try {
      for (const key of eosystemKeys) {
        const ecosystemKey = await this.prisma.ecosystem_config.findFirst({
          where: {
            key
          }
        });

        await this.prisma.ecosystem_config.update({
          where: {
            id: ecosystemKey.id
          },
          data: {
            value: ecosystemObj[key].toString()
          }
        });
      }

      return true;
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

  async getEcosystemSettings(): Promise<object> {
    try {
      const getEcosystemSettingsList = await this.prisma.ecosystem_config.findMany();
      return getEcosystemSettingsList;
    } catch (error) {
      this.logger.error(`error in getEcosystemSettings: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }
}
