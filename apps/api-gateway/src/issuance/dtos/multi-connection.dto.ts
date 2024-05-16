import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { AnonCredsDto, IndyDto, IssuanceFields, JsonLdDto } from './issuance.dto';

@ApiExtraModels(AnonCredsDto, JsonLdDto, IndyDto)
class ConnectionAttributes {
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
    @IsNotEmptyObject()
    @ValidateNested({each: true})
    credentialFormats: AnonCredsDto | JsonLdDto | IndyDto;
}

export class IssueCredentialDto extends IssuanceFields {
    @ApiProperty({
      type: [ConnectionAttributes]
    })
    // @IsArray()
    // @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} connections max).` })
    @IsNotEmpty({ message: 'credentialData is required' })
    credentialData: ConnectionAttributes[];
}
