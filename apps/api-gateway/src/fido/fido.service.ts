import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { UpdateFidoUserDetailsDto, VerifyRegistrationDto, GenerateAuthenticationDto, VerifyAuthenticationDto } from '../dtos/fido-user.dto';


@Injectable()
export class FidoService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly fidoServiceProxy: ClientProxy
    ) {
        super('FidoService');
    }
    async generateRegistrationOption(deviceFlag: boolean, email:string): Promise<{response: object}> {
        try {
            const payload = { deviceFlag, email };
            return await this.sendNats(this.fidoServiceProxy, 'generate-registration-options', payload);
        } catch (error) {
            throw new RpcException(error.response);
        }
     
    }

    async verifyRegistration(verifyRegistrationDto: VerifyRegistrationDto, email: string): Promise<{response: object}> {
        const payload = { verifyRegistrationDetails: verifyRegistrationDto, email };
        return this.sendNats(this.fidoServiceProxy, 'verify-registration', payload);
    }

    async generateAuthenticationOption(generateAuthentication: GenerateAuthenticationDto) : Promise<{response: object}> {
        const payload = { generateAuthentication };
        return this.sendNats(this.fidoServiceProxy, 'generate-authentication-options', payload);
    }

    async verifyAuthentication(verifyAuthenticationDto: VerifyAuthenticationDto, email: string): Promise<{response: object}> {
        const payload = { verifyAuthenticationDetails: verifyAuthenticationDto, email };
        return this.sendNats(this.fidoServiceProxy, 'verify-authentication', payload);
    }

    async updateFidoUser(updateFidoUserDetailsDto: UpdateFidoUserDetailsDto, credentialId: string) : Promise<{response: object}> {
        const payload = {updateFidoUserDetailsDto, credentialId};
        return this.sendNats(this.fidoServiceProxy, 'update-user', payload);
    }

    async fetchFidoUserDetails(email: string): Promise<{response: string}> {
        const payload = { email };
        return this.sendNats(this.fidoServiceProxy, 'fetch-fido-user-details', payload);
    }

    async deleteFidoUserDevice(credentialId: string): Promise<{response: object}> {
        const payload = { credentialId };
        return this.sendNats(this.fidoServiceProxy, 'delete-fido-user-device', payload);
    }

    async updateFidoUserDeviceName(credentialId: string, deviceName: string): Promise<{response: string}> {
        const payload = { credentialId, deviceName };
        return this.sendNats(this.fidoServiceProxy, 'update-fido-user-device-name', payload);
    }
}
