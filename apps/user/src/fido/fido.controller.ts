import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GenerateRegistrationDto, VerifyRegistrationPayloadDto, VerifyAuthenticationPayloadDto, UpdateFidoUserDetailsDto, UserNameDto, credentialDto, updateDeviceDto } from './dtos/fido-user.dto';
import { FidoService } from './fido.service';

@Controller('fido')
export class FidoController {
    constructor(private readonly fidoService: FidoService) { }
    private readonly logger = new Logger('PS-Fido-controller');

   /**
   * Description: FIDO User Registration
   * @param payload Registration Details
   * @returns Get registered user response
   */
    @MessagePattern({ cmd: 'generate-registration-options' })
    async generateRegistrationOption(payload: GenerateRegistrationDto): Promise<object> {
        return this.fidoService.generateRegistration(payload);
    }

   /**
   * Description: FIDO User Registration
   * @param payload Verify registration
   * @returns Get verify registration response
   */
    @MessagePattern({ cmd: 'verify-registration' })
    verifyRegistration(payload: VerifyRegistrationPayloadDto): Promise<object> {
        return this.fidoService.verifyRegistration(payload);
    }
    /**
   * Description: FIDO User Verification
   * @param payload Authentication details
   * @returns Get authentication response
   */
    @MessagePattern({ cmd: 'generate-authentication-options' })
    generateAuthenticationOption(payload: GenerateRegistrationDto): Promise<object> {
        return this.fidoService.generateAuthenticationOption(payload.email);
    }
    /**
   * Description: FIDO User Verification
   * @param payload Verify authentication details
   * @returns Get verify authentication details response
   */
    @MessagePattern({ cmd: 'verify-authentication' })
    verifyAuthentication(payload: VerifyAuthenticationPayloadDto): Promise<object> {
        return this.fidoService.verifyAuthentication(payload);
    }
    /**
   * Description: FIDO User update
   * @param payload User Details
   * @returns Get updated user detail response
   */
    @MessagePattern({ cmd: 'update-user' })
    updateUser(payload: UpdateFidoUserDetailsDto): Promise<string> {
        return this.fidoService.updateUser(payload);
    }
    /**
   * Description: fetch FIDO user details
   * @param payload User name
   * 
   */
    @MessagePattern({ cmd: 'fetch-fido-user-details' })
    fetchFidoUserDetails(payload: UserNameDto):Promise<object> {
        return this.fidoService.fetchFidoUserDetails(payload.email);
    }

    /**
   * Description: delete FIDO user details
   * @param payload credentialId
   * 
   */
    @MessagePattern({ cmd: 'delete-fido-user-device' })
    deleteFidoUserDevice(payload: credentialDto):Promise<string>  {
        return this.fidoService.deleteFidoUserDevice(payload);
    }

    /**
   * Description: update FIDO user details
   * @param payload credentialId and deviceName
   * 
   */
    @MessagePattern({ cmd: 'update-fido-user-device-name' })
    updateFidoUserDeviceName(payload: updateDeviceDto):Promise<string>  {
        return this.fidoService.updateFidoUserDeviceName(payload);
    }
}
