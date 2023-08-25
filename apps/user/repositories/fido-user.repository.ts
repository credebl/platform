import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { user } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

type UserUpdateData = {
  fidoUserId?: string;
  isFidoVerified?: boolean;
  username?: string;
  // Add other properties you want to update
};

@Injectable()
export class FidoUserRepository {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }

  
  /**
   * 
   * @param createUserDto 
   * @returns user details
   */
  async createUser(createUserDto: CreateUserDto): Promise<user> {
    try {
      const verifyCode = uuidv4();

      const saveResponse = await this.prisma.user.create({
        data: {
          username: createUserDto.email,
          email: createUserDto.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          verificationCode: verifyCode
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
  async checkFidoUserExist(email: string): Promise<user> {
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

  // eslint-disable-next-line camelcase
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
 * @param tenantDetails 
 * @returns Updates organization details
 */
  // eslint-disable-next-line camelcase
  async updateFidoUserDetails(email:string, fidoUserId: string, username: string): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          email
        },
        data: {
          fidoUserId,
          username
        }
      });
      return updateUserDetails;

    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }


  async updateUserDetails(email:string, additionalParams:UserUpdateData[]): Promise<user> {
    try {
      const updateUserDetails = await this.prisma.user.update({
        where: {
          email
        },
        data: { ...additionalParams[0]}
      });
      return updateUserDetails;

    } catch (error) {
      this.logger.error(`Error in update isEmailVerified: ${error.message} `);
      throw error;
    }
  }
}

