import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { SignerOption } from '@prisma/client';

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
      dcql: {
        query: {
          combine: 'all',
          credentials: [
            {
              id: 'example-dc_sd_jwt',
              format: 'dc+sd-jwt',
              meta: {
                vct: 'urn:example:vc+sd-jwt'
              },
              require_cryptographic_holder_binding: true,
              claims: [
                {
                  path: ['full_name'],
                  intent_to_retain: true
                }
              ]
            }
          ]
        }
      }
    }
  })
  @IsObject()
  @IsNotEmpty()
  templateJson: object;

  @ApiProperty({ enum: SignerOption, description: 'Signer option type' })
  @IsEnum(SignerOption)
  signerOption!: SignerOption;
}

export class UpdateVerificationTemplateDto extends PartialType(CreateVerificationTemplateDto) {}
