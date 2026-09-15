import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common'; //InternalServerErrorException
import { CommonService } from '@credebl/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';
import { FidoUserRepository } from '../../repositories/fido-user.repository';
import {
  GenerateRegistrationDto,
  VerifyRegistrationPayloadDto,
  VerifyAuthenticationPayloadDto,
  UpdateFidoUserDetailsDto,
  credentialDto,
  updateDeviceDto
} from './dtos/fido-user.dto';
import { UserDevicesRepository } from '../../repositories/user-device.repository';
import { PrismaService } from '@credebl/prisma-service';
import { LoginUserDto } from 'apps/user/dtos/login-user.dto';
import { UserService } from '../user.service';

interface PasskeyDeviceOwnership {
  id: string;
  userId: string | null;
  deletedAt: Date | null;
}

@Injectable()
export class FidoService {
  private readonly logger = new Logger('PS-Fido-Service');
  constructor(
    private readonly fidoUserRepository: FidoUserRepository,
    private readonly userDevicesRepository: UserDevicesRepository,
    private readonly commonService: CommonService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService
  ) {}
  async generateRegistration(payload: GenerateRegistrationDto): Promise<object> {
    try {
      const { email, deviceFlag } = payload;
      const fidoUser = await this.fidoUserRepository.checkFidoUserExist(email.toLowerCase());
      if (!fidoUser && !fidoUser.id) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }

      if (!fidoUser || true === deviceFlag || false === deviceFlag) {
        const generatedOption = await this.generateRegistrationOption(email.toLowerCase());
        return generatedOption;
      } else if (!fidoUser.isFidoVerified) {
        const generatedOption = await this.updateUserRegistrationOption(email.toLowerCase());
        return generatedOption;
      } else {
        throw new BadRequestException(ResponseMessages.fido.error.exists);
      }
    } catch (error) {
      this.logger.error(`Error in generate registration option:::${error}`);
      throw new RpcException(error.response);
    }
  }

  generateRegistrationOption(email: string): Promise<object> {
    const url = `${process.env.FIDO_API_ENDPOINT}/generate-registration-options/?userName=${email.toLowerCase()}`;
    return this.commonService
      .httpGet(url, { headers: { 'Content-Type': 'application/json' } })
      .then(async (response) => {
        const { user } = response;
        const updateUser = await this.fidoUserRepository.updateUserDetails(email.toLowerCase(), [
          { fidoUserId: user.id },
          { username: user.name }
        ]);
        if (updateUser.fidoUserId === user.id) {
          return response;
        } else {
          throw new InternalServerErrorException(ResponseMessages.fido.error.generateRegistration);
        }
      });
  }

  updateUserRegistrationOption(email: string): Promise<object> {
    const url = `${process.env.FIDO_API_ENDPOINT}/generate-registration-options/?userName=${email.toLowerCase()}`;
    return this.commonService
      .httpGet(url, { headers: { 'Content-Type': 'application/json' } })
      .then(async (response) => {
        const { user } = response;
        await this.fidoUserRepository.updateUserDetails(email.toLowerCase(), [
          { fidoUserId: user.id },
          { isFidoVerified: false }
        ]);
        return response;
      });
  }

  async verifyRegistration(verifyRegistrationDto: VerifyRegistrationPayloadDto): Promise<object> {
    try {
      const { verifyRegistrationDetails, email } = verifyRegistrationDto;
      const url = `${process.env.FIDO_API_ENDPOINT}/verify-registration`;
      const payload = JSON.stringify(verifyRegistrationDetails);
      const response = await this.commonService.httpPost(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response?.verified && email.toLowerCase()) {
        await this.fidoUserRepository.updateUserDetails(email.toLowerCase(), [{ isFidoVerified: true }]);
        const credentialID = this.normalizeCredentialId(response.newDevice.credentialID);
        response.newDevice.credentialID = credentialID;
        const getUser = await this.fidoUserRepository.checkFidoUserExist(email.toLowerCase());
        await this.userDevicesRepository.createMultiDevice(response?.newDevice, getUser.id, credentialID);
        return response;
      } else {
        throw new InternalServerErrorException(ResponseMessages.fido.error.verification);
      }
    } catch (error) {
      this.logger.error(`Error in verify registration option:::${error}`);
      throw new RpcException(error);
    }
  }

  async generateAuthenticationOption(email: string): Promise<object> {
    try {
      const fidoUser = await this.fidoUserRepository.checkFidoUserExist(email?.toLowerCase());
      if (fidoUser && fidoUser.id) {
        const fidoMultiDevice = await this.userDevicesRepository.getfidoMultiDevice(fidoUser.id);
        const credentialIds = [];
        if (fidoMultiDevice) {
          for (const iterator of fidoMultiDevice) {
            credentialIds.push(iterator.devices['credentialID']);
          }
        } else {
          throw new BadRequestException(ResponseMessages.fido.error.deviceNotFound);
        }
        const url = `${process.env.FIDO_API_ENDPOINT}/generate-authentication-options`;
        return await this.commonService
          .httpPost(url, credentialIds, { headers: { 'Content-Type': 'application/json' } })
          .then(async (response) => response);
      } else {
        throw new BadRequestException(ResponseMessages.fido.error.invalidCredentials);
      }
    } catch (error) {
      this.logger.error(`Error in generate authentication option:::${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  async verifyAuthentication(verifyAuthenticationDto: VerifyAuthenticationPayloadDto): Promise<object> {
    try {
      const { verifyAuthenticationDetails, email } = verifyAuthenticationDto;
      const fidoUser = await this.fidoUserRepository.checkFidoUserExist(email.toLowerCase());
      const fidoMultiDevice = await this.userDevicesRepository.getfidoMultiDeviceDetails(fidoUser.id);
      const url = `${process.env.FIDO_API_ENDPOINT}/verify-authentication`;
      const payload = {
        verifyAuthenticationDetails: JSON.stringify(verifyAuthenticationDetails),
        devices: fidoMultiDevice
      };

      const credentialId = this.normalizeCredentialId(verifyAuthenticationDetails.id);
      const getUserDevice = await this.userDevicesRepository.checkUserDeviceByCredentialId(credentialId);
      if (getUserDevice) {
        const loginCounter = getUserDevice?.authCounter + 1;
        if (!payload.devices) {
          throw new BadRequestException(ResponseMessages.fido.error.deviceNotFound);
        } else {
          return await this.commonService
            .httpPost(url, payload, { headers: { 'Content-Type': 'application/json' } })
            .then(async (response) => {
              if (true === response.verified) {
                await this.userDevicesRepository.updateFidoAuthCounter(credentialId, loginCounter);
                const userDetails: LoginUserDto = {
                  email,
                  isPasskey: response.verified
                };
                const authDetails = await this.userService.login(userDetails);
                return authDetails;
              } else {
                throw new BadRequestException(ResponseMessages.fido.error.deviceNotFound);
              }
            });
        }
      } else {
        throw new InternalServerErrorException(ResponseMessages.fido.error.deviceNotFound);
      }
    } catch (error) {
      this.logger.error(`Error in verify authentication:::${error}`);
      throw new RpcException(ResponseMessages.fido.error.deviceNotFound);
    }
  }

  async updateUser(updateFidoUserDetailsDto: UpdateFidoUserDetailsDto & { actorEmail: string }): Promise<string> {
    try {
      const { actorEmail, credentialId, ...userDetails } = updateFidoUserDetailsDto;
      const normalizedCredentialId = this.normalizeCredentialId(credentialId);
      const ownedDevice = await this.assertDeviceOwnership(normalizedCredentialId, actorEmail);
      const updateFidoUserDetails = JSON.stringify({ ...userDetails, credentialId: normalizedCredentialId });
      const updateFidoUser = await this.userDevicesRepository.updateDeviceByCredentialId(normalizedCredentialId);

      if (updateFidoUser[0]?.id && updateFidoUser[0].id === ownedDevice.id) {
        await this.userDevicesRepository.addCredentialIdAndNameById(ownedDevice.id, updateFidoUserDetails);
      }
      if (updateFidoUser[0]?.id) {
        return 'User updated.';
      } else {
        throw new InternalServerErrorException(ResponseMessages.fido.error.updateFidoUser);
      }
    } catch (error) {
      this.logger.error(`Error in update user details:::${error}`);
      throw new RpcException(error);
    }
  }

  async fetchFidoUserDetails(email: string): Promise<object> {
    try {
      const fidoUser = await this.fidoUserRepository.checkFidoUserExist(email.toLowerCase());
      if (!fidoUser) {
        throw new NotFoundException(ResponseMessages.user.error.notFound);
      }
      const multiDevice = await this.userDevicesRepository.fidoMultiDevice(fidoUser.id);
      if (multiDevice) {
        return multiDevice;
      } else {
        throw new RpcException(Error);
      }
    } catch (error) {
      this.logger.error(`Error in fetching the user details:::${error}`);
      throw new RpcException(error);
    }
  }

  async deleteFidoUserDevice(payload: credentialDto): Promise<string> {
    try {
      const { credentialId, actorEmail } = payload;
      const normalizedCredentialId = this.normalizeCredentialId(credentialId);
      await this.assertDeviceOwnership(normalizedCredentialId, actorEmail);
      const deleteUserDevice = await this.userDevicesRepository.deleteUserDeviceByCredentialId(normalizedCredentialId);
      if (1 === deleteUserDevice.count) {
        return 'Device deleted successfully';
      } else {
        return 'Not deleting this device kindly verify';
      }
    } catch (error) {
      this.logger.error(`Error in delete user device :::${error}`);
      throw new RpcException(error);
    }
  }

  async updateFidoUserDeviceName(payload: updateDeviceDto): Promise<string> {
    try {
      const { credentialId, deviceName, actorEmail } = payload;
      const normalizedCredentialId = this.normalizeCredentialId(credentialId);
      const getUserDevice = await this.assertDeviceOwnership(normalizedCredentialId, actorEmail);
      const updateUserDevice = await this.userDevicesRepository.updateUserDeviceByCredentialId(
        getUserDevice.id,
        deviceName
      );
      if (1 === updateUserDevice.count) {
        return 'Device name updated successfully.';
      } else {
        return 'Device name has not been changed.';
      }
    } catch (error) {
      this.logger.error(`Error in delete user device :::${error}`);
      throw new RpcException(error);
    }
  }

  private async assertDeviceOwnership(credentialId: string, actorEmail: string): Promise<PasskeyDeviceOwnership> {
    const actor = await this.fidoUserRepository.getUserDetails(actorEmail.toLowerCase());
    const device = await this.userDevicesRepository.checkUserDeviceByCredentialId(credentialId);

    if (!actor || !device || device.userId !== actor.id || device.deletedAt) {
      throw new ForbiddenException('Passkey device can only be managed by its owner');
    }

    return device;
  }

  private normalizeCredentialId(credentialId: string): string {
    if ('string' !== typeof credentialId) {
      throw new BadRequestException('Invalid passkey credential ID');
    }

    let endIndex = credentialId.length;
    while (0 < endIndex && '=' === credentialId.charAt(endIndex - 1)) {
      endIndex -= 1;
    }
    const unpaddedCredentialId = credentialId.slice(0, endIndex);
    if (!/^[A-Za-z0-9+/_-]+$/.test(unpaddedCredentialId)) {
      throw new BadRequestException('Invalid passkey credential ID');
    }

    if (1 === unpaddedCredentialId.length % 4) {
      throw new BadRequestException('Invalid passkey credential ID');
    }

    return unpaddedCredentialId.replace(/\+/g, '-').replace(/\//g, '_');
  }
}
