import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GenerateRegistrationDto {

  @IsOptional()
  @ApiProperty({ example: 'false' })
  @IsBoolean({ message: 'isPasskey should be boolean' })
  deviceFlag: boolean;
}

export class ResponseDto {
  @ApiProperty()
  @IsString()
  attestationObject: string;

  @ApiProperty()
  @IsString()
  clientDataJSON: string;

  @ApiProperty()
  @IsArray()
  transports: string[];
}

export class ClientExtensionResultsDto {
  @ValidateNested()
  credProps: Record<string, unknown>;
}

export class VerifyRegistrationDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  rawId: string;

  @ApiProperty({ type: ResponseDto, nullable: true }) 
  @IsOptional()
  response: ResponseDto;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty() 
  clientExtensionResults: ClientExtensionResultsDto; 

  @ApiProperty()
  @IsString()
  authenticatorAttachment: string;

  @ApiProperty()
  @IsString()
  challangeId: string;
}

export class UpdateFidoUserDetailsDto {
  @ApiProperty()
  @IsString()
  userName: string;

  @ApiProperty()
  @IsString()
  credentialId: string;

  @ApiProperty()
  @IsString()
  deviceFriendlyName: string;
}

export class GenerateAuthenticationDto {
  @ApiProperty({ example: 'abc@vomoto.com' })
  @IsString()
  userName: string;
}

class VerifyAuthenticationResponseDto {
    @ApiProperty()
    @IsString()
    authenticatorData: string;
  
    @ApiProperty()
    @IsString()
    clientDataJSON: string;
  
    @ApiProperty()
    @IsString()
    signature: string;
  
    @ApiProperty()
    @IsString()
    userHandle: string;
  }
  

  export class VerifyAuthenticationDto {
    @ApiProperty()
    @IsString()
    id: string;
  
    @ApiProperty()
    @IsString()
    rawId: string;
  
    @ApiProperty() 
    @IsOptional()
    response: VerifyAuthenticationResponseDto;
  
    @ApiProperty()
    @IsString()
    type: string;
  
    @ApiProperty()
    clientExtensionResults?: ClientExtensionResultsDto;
  
    @ApiProperty()
    @IsString()
    authenticatorAttachment: string;
  
    @ApiProperty()
    @IsString()
    challangeId: string;
  }

  export class UserNameDto {
    @ApiProperty()
    @IsString()
    userName: string;
  }