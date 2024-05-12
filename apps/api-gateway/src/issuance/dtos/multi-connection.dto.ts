import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AutoAccept } from '@credebl/enum/enum';
import { trim } from '@credebl/common/cast.helper';
import { AnonCredsDto, CredentialsIssuanceDto, IndyDto, JsonLdDto } from './issuance.dto';

@ApiExtraModels(AnonCredsDto)
@ApiExtraModels(JsonLdDto)
@ApiExtraModels(IndyDto)
class ConnectionAttributes {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    @Transform(({ value }) => trim(value))
    connectionId: string;

    // Note: Anon creds default
    // @ApiProperty({
    //   example: [
    //     {
    //       value: 'string',
    //       name: 'string'
    //     }
    //   ]
    // })
    // @IsArray()
    // @ValidateNested({ each: true })
    // @ArrayMinSize(1)
    // @IsNotEmpty({ message: 'Please provide valid attributes' })
    // @Type(() => Attribute)
    // @IsOptional()
    // attributes?: Attribute[];

    // @ApiProperty()
    // @IsNotEmpty({ message: 'Please provide valid credential' })
    // @IsObject({ message: 'credential should be an object' })
    // @Type(() => Credential)
    // @IsOptional()
    // @ValidateNested({ each: true })
    // credential?: Credential;

    @ApiProperty({
      anyOf: [
        { $ref: getSchemaPath(AnonCredsDto) },
        { $ref: getSchemaPath(JsonLdDto) },
        { $ref: getSchemaPath(IndyDto) }
      ]
    })
    credentialFormats: AnonCredsDto | JsonLdDto | IndyDto;

    // Note: Anon creds default
    // @ApiProperty()
    // @IsNotEmpty({ message: 'Please provide valid options' })
    // @IsObject({ message: 'options should be an object' })
    // @Type(() => JsonLdCredentialDetailOptions)
    // @IsOptional()
    // @ValidateNested({ each: true })
    // options?:JsonLdCredentialDetailOptions;
}

export class IssueCredentialDto extends CredentialsIssuanceDto {
    @ApiProperty({
      type: [ConnectionAttributes]
      // example: [
      //     {
      //         'connectionId': 'string',
      //         'attributes': [
      //             {
      //                 'value': 'string',
      //                 'name': 'string'
      //             }
      //         ],
      //         'credential': {
      //           '@context': [
      //             'https://www.w3.org/2018/credentials/v1',
      //             'https://www.w3.org/2018/credentials/examples/v1'
      //           ],
      //           'type': [
      //             'VerifiableCredential',
      //             'UniversityDegreeCredential'
      //           ],
      //           'issuer': {
      //             'id': 'did:key:z6Mkn72LVp3mq1fWSefkSMh5V7qrmGfCV4KH3K6SoTM21ouM'
      //           },
      //           'issuanceDate': '2019-10-12T07:20:50.52Z',
      //           'credentialSubject': {
      //             'id': 'did:key:z6Mkn72LVp3mq1fWSefkSMh5V7qrmGfCV4KH3K6SoTM21ouM',
      //             'degree': {
      //               'type': 'BachelorDegree',
      //               'name': 'Bachelor of Science and Arts'
      //             }
      //           }
      //         },
      //         'options': {
      //           'proofType': 'Ed25519Signature2018',
      //           'proofPurpose': 'assertionMethod'
      //         }
      
      //     }
      // ]
    })
    @IsArray()
    // @ValidateNested({ each: true })
    @ArrayMinSize(1)
    // @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} connections max).` })
    @IsNotEmpty({ message: 'credentialData is required' })
    // @Type(() => ConnectionAttributes)
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
