import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateVerificationTemplateDto {
  @ApiProperty({
    description: 'Name of the verification template',
    example: 'KYC Verification Template'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'JSON configuration for the verification template',
    example: {
      requestedCredentials: ['VerifiableCredential'],
      presentationDefinition: {
        id: 'example-pd',
        /* eslint-disable camelcase */
        input_descriptors: []
      }
    }
  })
  @IsObject()
  @IsNotEmpty()
  templateJson: object;
}

export class UpdateVerificationTemplateDto extends PartialType(CreateVerificationTemplateDto) {}
