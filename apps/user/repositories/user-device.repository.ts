import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { Prisma, user_devices } from '@prisma/client';

type FidoMultiDevicePayload = {
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  devices: Prisma.JsonValue;
  credentialId: string;
  deviceFriendlyName: string;
  id: string;
}[];
@Injectable()
export class UserDevicesRepository {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }

  /**
   * 
   * @param email 
   * @returns User exist details
   */

  // eslint-disable-next-line camelcase
  async checkUserDevice(userId: string): Promise<user_devices> {
    try {
      return this.prisma.user_devices.findFirst({
        where: {
          userId:String(userId)
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
     * 
     * @param createFidoMultiDevice
     * @returns Device details
     */
  // eslint-disable-next-line camelcase
  async createMultiDevice(newDevice: Prisma.JsonValue, userId: string): Promise<user_devices> {
    try {

      const saveResponse = await this.prisma.user_devices.create({
        data: {
          devices: newDevice,
          userId:String(userId),
          createdBy: userId,
          lastChangedBy: userId
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
     * @param userId
     * @returns Device details
     */
  // eslint-disable-next-line camelcase
  async fidoMultiDevice(userId: string): Promise<user_devices[]> {
    try {
      const userDetails = await this.prisma.user_devices.findMany({
        where: {
          userId:String(userId),
          deletedAt: null
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });

      return userDetails;
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
     * 
     * @param userId
     * @returns Get all device details
     */
  // eslint-disable-next-line camelcase, @typescript-eslint/no-explicit-any
  async getfidoMultiDevice(userId: string): Promise<user_devices[]> {
    try {

      const fidoMultiDevice = await this.prisma.user_devices.findMany({
        where: {
          userId:String(userId)
        }
      });
      return fidoMultiDevice;
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
     * 
     * @param userId
     * @returns Get all active device details
     */
  async getfidoMultiDeviceDetails(userId: string): Promise<FidoMultiDevicePayload> {
    try {
      const fidoMultiDevice = await this.prisma.user_devices.findMany({
        where: {
          userId:String(userId),
          deletedAt: null
        },
        select: {
          id: true,
          createDateTime: true,
          createdBy: true,
          lastChangedDateTime: true,
          lastChangedBy: true,
          devices: true,
          credentialId: true,
          deviceFriendlyName: true
        }
      });
      return fidoMultiDevice;
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
     * 
     * @param credentialId
     * @returns Find device details from credentialID
     */
  async getFidoUserDeviceDetails(credentialId: string): Promise<unknown> {
    this.logger.log(`credentialId: ${credentialId}`);
    try {
      const getUserDevice = await this.prisma.$queryRaw`
  SELECT * FROM user_devices
  WHERE credentialId LIKE '%${credentialId}%'
  LIMIT 1;
`;
      return getUserDevice;
    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
     * 
     * @param credentialId 
     * @param loginCounter
     * @returns Update Auth counter
     */
  async updateFidoAuthCounter(credentialId: string, loginCounter: number): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.user_devices.updateMany({
        where: {
          credentialId
        },
        data: {
          authCounter: loginCounter
        }
      });

    } catch (error) {
      this.logger.error(`Not Found: ${JSON.stringify(error)}`);
      throw new NotFoundException(error);
    }
  }

  /**
     * 
     * @param credentialId 
     * @returns Device detail for specific credentialId
     */
  // eslint-disable-next-line camelcase
  async checkUserDeviceByCredentialId(credentialId: string): Promise<user_devices> {
    this.logger.log(`checkUserDeviceByCredentialId: ${credentialId}`);
    try {
      return await this.prisma.user_devices.findFirst({
        where: {
          credentialId
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
     * 
     * @param credentialId 
     * @returns Delete device
     */
  // eslint-disable-next-line camelcase
  async deleteUserDeviceByCredentialId(credentialId: string): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.user_devices.updateMany({
        where: {
          credentialId
        },
        data: {
          deletedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }
  /**
     * 
     * @param id 
     * @param deviceName
     * @returns Update device name
     */
  async updateUserDeviceByCredentialId(id: string, deviceName: string): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.user_devices.updateMany({
        where: {
          id
        },
        data: {
          deviceFriendlyName: deviceName
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
     * 
     * @param credentialId
     * @param deviceFriendlyName 
     * @returns Get device details name for specific credentialId
     */
  async updateDeviceByCredentialId(credentialId: string): Promise<Prisma.BatchPayload> {
    try {
      return await this.prisma.$queryRaw`
    SELECT * FROM user_devices
    WHERE devices->>'credentialID' = ${credentialId}
  `;
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
     * 
     * @param id 
     * @param credentialId
     * @param deviceFriendlyName 
     * @returns Update device name for specific credentialId
     */
  // eslint-disable-next-line camelcase
  async addCredentialIdAndNameById(id: string, updateFidoUserDetails: string): Promise<user_devices> {

    try {
      return await this.prisma.user_devices.update({
        where: {
          id
        },
        data: {
          credentialId: JSON.parse(updateFidoUserDetails).credentialId,
          deviceFriendlyName: JSON.parse(updateFidoUserDetails).updateFidoUserDetailsDto.deviceFriendlyName
        }
      });
    } catch (error) {
      this.logger.error(`checkUserExist: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

}
