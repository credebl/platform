import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { AnonCredsDto, IndyDto, IssuanceFields, JsonLdDto } from './issuance.dto';

@ApiExtraModels(AnonCredsDto, JsonLdDto, IndyDto)
export class ConnectionAttributes {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    @Transform(({ value }) => trim(value))
    connectionId: string;

    @ApiProperty({
      type: Object,
      oneOf: [
        { $ref: getSchemaPath(AnonCredsDto) },
        { $ref: getSchemaPath(JsonLdDto) },
        { $ref: getSchemaPath(IndyDto) }
      ]
    })
    @IsNotEmpty()
    @Type(({ object }) => {
      if (object.credentialFormats?.anoncreds) {
        return AnonCredsDto;
      } else if (object.credentialFormats?.jsonld) {
        return JsonLdDto;
      } else if (object.credentialFormats?.indy) {
        return IndyDto;
      }
    })
    credentialFormats: AnonCredsDto | JsonLdDto | IndyDto;
}

export class IssueCredentialDto extends IssuanceFields {
    @ApiProperty({
      type: () => [ConnectionAttributes]
    })
    @ArrayMinSize(1)
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} connections max).` })
    @IsNotEmpty({ message: 'credentialData is required' })
    @ValidateNested()
    @Type(() => ConnectionAttributes)
    credentialData: ConnectionAttributes[];
}
