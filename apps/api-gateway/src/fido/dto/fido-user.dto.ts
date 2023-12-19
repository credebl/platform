import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';


export class GenerateRegistrationDto {
    @ApiProperty({ example: 'abc@vomoto.com' })
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    userName: string;
    
    @IsOptional()
    @ApiProperty({ example: 'false' })
    @IsBoolean({ message: 'isPasskey should be boolean' })
    deviceFlag: boolean;
}

export class VerifyRegistrationDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    rawId: string;

    @ApiProperty()
    response: Response;

    @ApiProperty()
    type: string;

    @ApiProperty()
    clientExtensionResults: ClientExtensionResults;

    @ApiProperty()
    authenticatorAttachment: string;

    @ApiProperty()
    challangeId: string;
}

export interface Response {
    attestationObject: string
    clientDataJSON: string
    transports: []
}

export interface ClientExtensionResults {
    credProps: CredProps
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CredProps { }


export class VerifyAuthenticationDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    rawId: string;

    @ApiProperty()
    response: Response;

    @ApiProperty()
    type: string;

    @ApiProperty()
    clientExtensionResults: ClientExtensionResults;

    @ApiProperty()
    authenticatorAttachment: string;

    @ApiProperty()
    challangeId: string;
}

export interface Response {
    authenticatorData: string
    clientDataJSON: string
    signature: string
    userHandle: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ClientExtensionResults { }


export class UpdateFidoUserDetailsDto {
    @ApiProperty()
    userName: string;

    @ApiProperty()
    credentialId: string;

    @ApiProperty()
    deviceFriendlyName: string;

}

export class GenerateAuthenticationDto {
    @ApiProperty({ example: 'abc@vomoto.com' })
    userName: string;
}
