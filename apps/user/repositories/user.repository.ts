/* eslint-disable prefer-destructuring */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateUserProfile, UserEmailVerificationDto, UserI, userInfo } from '../interfaces/user.interface';

import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { user } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface UserQueryOptions {
  id?: number; // Use the appropriate type based on your data model
  email?: string; // Use the appropriate type based on your data model
  // Add more properties if needed for other unique identifier fields
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }

  /**
   *
   * @param userEmailVerificationDto
   * @returns user email
   */
  async createUser(userEmailVerificationDto: UserEmailVerificationDto): Promise<user> {
    try {
      const verifyCode = uuidv4();
      const saveResponse = await this.prisma.user.create({
        data: {
          username: userEmailVerificationDto.email,
          email: userEmailVerificationDto.email,
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
      throw new InternalServerErrorException(error);
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
  async getUserById(id: number): Promise<UserI> {
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
    async getUserPublicProfile(id: number): Promise<UserI> {
          const queryOptions: UserQueryOptions = {
            id
          };
          return this.findUserForPublicProfile(queryOptions);
        }

  /**
   *
   * @Body updateUserProfile
   * @returns Update user profile data
   */
  async updateUserProfile(updateUserProfile: UpdateUserProfile): Promise<UpdateUserProfile> {
    try {
      const userdetails = await this.prisma.user.update({
        where: {
          id: Number(updateUserProfile.id)
        },
        data: {
          profileImg: updateUserProfile.profileImg,
          firstName: updateUserProfile.firstName,
          lastName: updateUserProfile.lastName
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

  async findUser(queryOptions: UserQueryOptions): Promise<UserI> {
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
        publicProfile:true,
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
                org_agents: {
                  include: {
                    // eslint-disable-next-line camelcase
                    agents_type: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async findUserForPublicProfile(queryOptions: UserQueryOptions): Promise<UserI> {
    return this.prisma.user.findFirst({
      where: {       
        publicProfile: true,
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
        isEmailVerified: true,
        publicProfile: true,
        userOrgRoles: {
          include: {
            orgRole: true,
            organisation: {
              select: {
                id: true,
                name: true,
                description: true,
                logoUrl: true,
                website: true
              },
              where:{
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
  async updateUserDetails(id: number, supabaseUserId: string): Promise<user> {
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
  async updateUserInfo(email: string, userInfo: userInfo): Promise<user> {
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
  async findOrgUsers(queryOptions: object, pageNumber: number, pageSize: number, filterOptions?: object): Promise<object> {

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
          clientId: true,
          clientSecret: true,
          supabaseUserId: true,
          userOrgRoles: {
            where: {
              ...filterOptions
              // Additional filtering conditions if needed
            },
            include: {
              orgRole: true,
              organisation: {
                include: {
                  // eslint-disable-next-line camelcase
                  org_agents: {
                    include: {
                      // eslint-disable-next-line camelcase
                      agents_type: true
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

  async verifyUser(email: string): Promise<user> {
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

}
