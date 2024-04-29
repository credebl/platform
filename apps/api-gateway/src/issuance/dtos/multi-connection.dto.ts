import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AutoAccept } from '@credebl/enum/enum';
import { trim } from '@credebl/common/cast.helper';
import { Attribute, Credential, CredentialsIssuanceDto, JsonLdCredentialDetailOptions } from './issuance.dto';

class ConnectionAttributes {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    @Transform(({ value }) => trim(value))
    connectionId: string;

    @ApiProperty({
        example: [
            {
                value: 'string',
                name: 'string'
            }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @Type(() => Attribute)
    @IsOptional()
    attributes?: Attribute[];

    @IsNotEmpty({ message: 'Please provide valid credential' })
    @IsObject({ message: 'credential should be an object' })
    @Type(() => Credential)
    @IsOptional()
    @ValidateNested({ each: true })
    credential?: Credential;

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid options' })
    @IsObject({ message: 'options should be an object' })
    @ValidateNested({ each: true })
    @Type(() => JsonLdCredentialDetailOptions)
    options?:JsonLdCredentialDetailOptions;
}

export class IssueCredentialDto extends CredentialsIssuanceDto {
    @ApiProperty({
      example: [
          {
              connectionId: 'string',
              attributes: [
                  {
                      value: 'string',
                      name: 'string'
                  }
              ]
          }
      ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} connections max).` })
    @IsNotEmpty({ message: 'credentialData is required' })
    @Type(() => ConnectionAttributes)
    credentialData: ConnectionAttributes[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept credential. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptCredential?: string;

    @ApiProperty({
        example: false
      })
      @IsOptional()
      @IsNotEmpty()
      @IsBoolean({message: 'isShortenUrl must be boolean'})
      isShortenUrl?: boolean;
    
}
