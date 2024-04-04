import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { AutoAccept } from '@credebl/enum/enum';
import { trim } from '@credebl/common/cast.helper';
import { Attribute, CredentialsIssuanceDto } from './issuance.dto';

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
    attributes: Attribute[];
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
