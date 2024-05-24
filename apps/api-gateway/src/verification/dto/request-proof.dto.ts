import { ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString, ValidateIf, ValidateNested, IsUUID, ArrayUnique, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { IsNestedElements, trim } from '@credebl/common/cast.helper';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { AutoAccept, ProtocolVersion } from '@credebl/enum/enum';
import { ProofRequestType } from '../enum/verification.enum';
import { BadRequestException } from '@nestjs/common';

export class ProofRequestAttribute {

    @ValidateIf((obj) => obj.attributeNames === undefined)
    @IsNotEmpty()
    @IsString()
    attributeName?: string;

    @ValidateIf((obj) => obj.attributeName === undefined)
    @IsArray({ message: 'attributeNames must be an array.' })
    @ArrayNotEmpty({ message: 'array can not be empty' })
    @IsString({ each: true })
    @IsNotEmpty({ each: true, message: 'each element cannot be empty' })
    attributeNames?: string[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    schemaId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'condition is required.' })
    condition?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty({ message: 'value is required.' })
    @IsNumberString({}, { message: 'Value must be a number' })
    value?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    credDefId?: string;
}

export declare const PredicateType: readonly [">=", ">", "<=", "<"];
export type PredicateType = (typeof PredicateType)[number];

export class ProofRequestRestriction {
  @ApiPropertyOptional({example: '7qEncxNHupBrPBBtNB9e1p:2:Employee Visiting Card:0.1.1'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  schema_id?: string;

  @ApiPropertyOptional({example: 'did:indy:bcovrin:testnet:7qEncxNHupBrPBBtNB9e1p'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  schema_issuer_id?: string;

  @ApiPropertyOptional({example: 'Passport'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  schema_name?: string;

  @ApiPropertyOptional({example: '0.1.1'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  schema_version?: string;

  @ApiPropertyOptional({example: 'did:indy:bcovrin:testnet:7qEncxNHupBrPBBtNB9e1p'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  issuer_id?: string;

  @ApiPropertyOptional({example: '7qEncxNHupBrPBBtNB9e1p:3:CL:726198:default'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  cred_def_id?: string;

  @ApiPropertyOptional({example: 'did:indy:bcovrin:testnet:7qEncxNHupBrPBBtNB9e1p'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  schema_issuer_did?: string;

  @ApiPropertyOptional({example: 'did:indy:bcovrin:testnet:7qEncxNHupBrPBBtNB9e1p'})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  // eslint-disable-next-line camelcase
  issuer_did?: string;
  [key: `attr::${string}::marker`]: '1' | '0';
  [key: `attr::${string}::value`]: string;
}

export class RequestedAttribute {

  @ApiProperty({example: 'name'})
  @ValidateIf((obj) => obj.names === undefined)
  @IsNotEmpty()
  @IsString()
  name?: string;

  @ApiProperty()
  @ValidateIf((obj) => obj.name === undefined)
  @IsNotEmpty()
  @IsString()
  names?: string[];

  @ApiPropertyOptional({type: [ProofRequestRestriction]})
  @IsOptional()
  restrictions?: ProofRequestRestriction[];
}

export class RequestedPredicate {
  @ApiProperty()
  @IsString()
  // @IsOptional()
  @IsNotEmpty({ message: 'name is required.' })
  name: string;
  
  @ApiProperty({type: PredicateType, example: '<'})
  @IsNotEmpty({message: 'p_type must not be empty'})
  // eslint-disable-next-line camelcase
  p_type: PredicateType;

  @ApiProperty({type: Number})
  @IsNotEmpty({message: 'value must not be empty'})
  // eslint-disable-next-line camelcase
  p_value: number;

  @ApiPropertyOptional({type: [ProofRequestRestriction]})
  @IsOptional()
  @ValidateNested()
  @Type(() => ProofRequestRestriction)
  restrictions?: ProofRequestRestriction[];
}

@ApiExtraModels(RequestedPredicate, RequestedAttribute)
export class AnonCredsRequestProofFormat {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'name is required.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'version is required' })
  @IsString({ message: 'version must be in string format.' })
  version: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RequestedAttribute) }
  })
  @IsNotEmpty({message: 'requested_attributes must not be empty'})
  @IsNestedElements(RequestedAttribute)
  // eslint-disable-next-line camelcase
  requested_attributes?: Record<string, RequestedAttribute>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RequestedPredicate) }
  })
  @IsNotEmpty({message: 'requested_predicates must not be empty'})
  @IsNestedElements(RequestedPredicate)
  // eslint-disable-next-line camelcase
  requested_predicates?: Record<string, RequestedPredicate>;
}

export class AnoncredsVerificationDto {

  @ApiProperty({type: AnonCredsRequestProofFormat})
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AnonCredsRequestProofFormat)
  'anoncreds': AnonCredsRequestProofFormat;
}

class ProofPayload {
    @ApiPropertyOptional()
    @IsString({ message: 'goalCode must be in string' })
    @IsNotEmpty({ message: 'please provide valid goalCode' })
    @IsOptional()
    goalCode: string;

    @ApiPropertyOptional()
    @IsString({ message: 'parentThreadId must be in string' })
    @IsNotEmpty({ message: 'please provide valid parentThreadId' })
    @IsOptional()
    parentThreadId: string;

    @ApiPropertyOptional()
    @IsBoolean({ message: 'willConfirm must be in boolean' })
    @IsNotEmpty({ message: 'please provide valid willConfirm' })
    @IsOptional()
    willConfirm: boolean;

    @ApiPropertyOptional({enum: ProtocolVersion})
    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    @IsEnum(ProtocolVersion, {
      message: `Invalid ProtocolVersion. It should be one of: ${Object.values(ProtocolVersion).join(', ')}`
    })
    protocolVersion: ProtocolVersion;
}

export class Fields {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty({ message: 'path is required.' })
  path: string[];
}

export class Constraints {
  @ApiProperty({type: () => [Fields]})
  @IsOptional()
  @IsNotEmpty({ message: 'Fields are required.' })
  @ValidateNested()
  @Type(() => Fields)
  fields: Fields[];
}


export class Schema {
  @ApiProperty()
  @IsNotEmpty({ message: 'uri is required.' })
  @IsString()
  uri:string;

}
export class InputDescriptors {
  @ApiProperty()
  @IsNotEmpty({ message: 'id is required.' })
  @IsString()
  id:string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'name is required.' })
  name:string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsNotEmpty({ message: 'purpose is required.' })
  purpose:string;


  @ApiProperty({type: () => [Schema]})
  @IsNotEmpty({ message: 'schema is required.' })
  @ValidateNested()
  @Type(() => Schema)
  schema:Schema[];

  
  @ApiProperty({type: () => Constraints})
  @IsOptional()
  @IsNotEmpty({ message: 'Constraints are required.' })
  @ValidateNested()
  @Type(() => Constraints)
  constraints:Constraints;

}

export class ProofRequestPresentationDefinition {

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'id is required.' })
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({type: () =>  [InputDescriptors]})
  @IsNotEmpty({ message: 'inputDescriptors is required.' })
  @IsArray({ message: 'inputDescriptors must be an array' })
  @ArrayMinSize(1, {message: 'input_descriptors must be non empty'})
  @ValidateNested()
  @Type(() => InputDescriptors)
  // eslint-disable-next-line camelcase
  input_descriptors:InputDescriptors[];
}

export class ProofRequestAttributeDto {
  @ApiProperty({
    'example': [
        {
            attributeName: 'attributeName',
            condition: '>=',
            value: 'predicates',
            credDefId: 'string',
            schemaId: 'string'
        }
    ],
    type: () => [ProofRequestAttribute]
})
@IsArray({ message: 'attributes must be in array' })
@ValidateNested()
@IsObject({ each: true })
@IsNotEmpty({ message: 'please provide valid attributes' })
@Type(() => ProofRequestAttribute)
attributes?: ProofRequestAttribute[];
}

export class IndyDto {
  @ApiProperty({
    'example': {
        'attributes': [
          {
            attributeName: 'attributeName',
            condition: '>=',
            value: 'predicates',
            credDefId: 'string',
            schemaId: 'string'
          }
        ]
      },
      type: () => [ProofRequestAttributeDto]
    })
  @ValidateNested()
  @IsObject({ each: true })
  @IsNotEmpty({ message: 'please provide valid attributes' })
  @Type(() => ProofRequestAttributeDto)
  indy: ProofRequestAttributeDto;
}

@ApiExtraModels(RequestedPredicate, RequestedAttribute)
export class IndyRequestProofFormat {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'name is required.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'version is required' })
  @IsString({ message: 'version must be in string format.' })
  version: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RequestedAttribute) }
  })
  @IsNotEmpty({message: 'requested_attributes must not be empty'})
  @IsNestedElements(RequestedAttribute)
  // eslint-disable-next-line camelcase
  requested_attributes?: Record<string, RequestedAttribute>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(RequestedPredicate) }
  })
  @IsNotEmpty({message: 'requested_predicates must not be empty'})
  @IsNestedElements(RequestedPredicate)
  // eslint-disable-next-line camelcase
  requested_predicates?: Record<string, RequestedPredicate>;
}

export class IndyVerificationDto {
    @ApiProperty({type: IndyRequestProofFormat})
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => IndyRequestProofFormat)
    'indy': IndyRequestProofFormat;
}

export class PresentationExchangeObject {
  @ApiProperty({type: ProofRequestPresentationDefinition})
  @IsObject({ message: 'presentationDefinition must be an object' })
  @IsNotEmpty({ message: 'presentationDefinition must not be empty' })
  @ValidateNested()
  @Type(() => ProofRequestPresentationDefinition)
  presentationDefinition:ProofRequestPresentationDefinition;
}

export class PresentationExchangeDto {

  @ApiProperty({type: PresentationExchangeObject})
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PresentationExchangeObject)
  'presentationExchange': PresentationExchangeObject;
}

@ApiExtraModels(AnoncredsVerificationDto, PresentationExchangeDto, IndyVerificationDto)
export class RequestProofDto extends ProofPayload {
    @ApiProperty({example: '7bb1db20-2b3e-4d7c-a773-46cc2871a2b4'})
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsUUID()
    @IsNotEmpty({ message: 'connectionId is required.' })
    connectionId: string;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(AnoncredsVerificationDto) },
      { $ref: getSchemaPath(PresentationExchangeDto) },
      { $ref: getSchemaPath(IndyVerificationDto) }
    ]
  })
  @ValidateNested()
  @Type(({ object }) => {
    const presentationType = object.type;
    switch (presentationType) {
      case ProofRequestType.ANONCREDS:
        return AnoncredsVerificationDto;
      case ProofRequestType.INDY:
        return IndyVerificationDto;
      case ProofRequestType.PRESENTATIONEXCHANGE:
        return PresentationExchangeDto;
      default:
        throw new BadRequestException('Invalid credentialType');
    }
  })
  @IsNotEmpty()
  proofFormats: AnoncredsVerificationDto | PresentationExchangeDto | IndyVerificationDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    @ApiProperty({enum: ProofRequestType})
    @IsNotEmpty()
    @IsEnum(ProofRequestType, {
      message: `Invalid ProofRequestType. It should be one of: ${Object.values(ProofRequestType).join(', ')}`
    })
    type: ProofRequestType;

    orgId: string;

    @ApiPropertyOptional({enum: AutoAccept})
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: AutoAccept;
}

export class OutOfBandRequestProof extends ProofPayload {
    @ApiProperty({
        'example': [
            {
                attributeName: 'attributeName',
                condition: '>=',
                value: 'predicates',
                credDefId: '',
                schemaId: ''
            }
        ],
        type: () => [ProofRequestAttribute]
    })
    @IsArray({ message: 'attributes must be in array' })
    @ValidateNested({ each: true })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    @Type(() => ProofRequestAttribute)
    attributes: ProofRequestAttribute[];

    @ApiProperty()
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => trim(value))
    @IsString({ each: true, message: 'Each emailId in the array should be a string' })
    @IsOptional()
    emailId?: string | string[];

    @ApiProperty()
    @IsOptional()
    comment: string;
    orgId: string;

    @ApiPropertyOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: string;
}

@ApiExtraModels(AnoncredsVerificationDto, PresentationExchangeDto, IndyVerificationDto)
export class SendProofRequestPayload {

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid goal code' })
    @IsString({ message: 'goal code should be string' })
    goalCode?: string;
    
    @ApiPropertyOptional({enum: ProtocolVersion})
    @IsString({ message: 'protocolVersion must be in string' })
    @IsEnum(ProtocolVersion, {
      message: `Invalid ProofRequestType. It should be one of: ${Object.values(ProtocolVersion).join(', ')}`
    })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: ProtocolVersion;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    @ApiProperty({
      oneOf: [
        { $ref: getSchemaPath(AnoncredsVerificationDto) },
        { $ref: getSchemaPath(PresentationExchangeDto) },
        { $ref: getSchemaPath(IndyVerificationDto) }
      ]
    })
    @ValidateNested()
    @Type(({ object }) => {
      const presentationType = object.type;
      switch (presentationType) {
        case ProofRequestType.ANONCREDS:
          return AnoncredsVerificationDto;
        case ProofRequestType.INDY:
          return IndyVerificationDto;
        case ProofRequestType.PRESENTATIONEXCHANGE:
          return PresentationExchangeDto;
        default:
          throw new BadRequestException('Invalid credentialType');
      }
    })
    @IsNotEmpty()
    proofFormats: AnoncredsVerificationDto | PresentationExchangeDto | IndyVerificationDto;

    @ApiProperty({enum: ProofRequestType})
    @IsNotEmpty()
    @IsEnum(ProofRequestType, {
      message: `Invalid ProofRequestType. It should be one of: ${Object.values(ProofRequestType).join(', ')}`
    })
    type: ProofRequestType;

    @ApiPropertyOptional({enum: AutoAccept})
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide from valid auto accept proof options' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: AutoAccept;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'label must be in string' })
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    @IsNotEmpty({ message: 'please provide valid parentThreadId' })
    parentThreadId: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({message:'Please provide the flag for shorten url.'})
    isShortenUrl?: boolean;

    @ApiPropertyOptional()
    @IsEmail({}, { each: true, message: 'Please provide a valid email' })
    @ArrayNotEmpty({ message: 'Email array must not be empty' })
    @ArrayUnique({ message: 'Duplicate emails are not allowed' })
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} proof request max).` })
    @IsArray()
    @IsString({ each: true, message: 'Each emailId in the array should be a string' })
    @IsOptional()
    emailId: string[];
    
    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid value for reuseConnection' })
    @IsBoolean({ message: 'reuseConnection must be a boolean' })
    reuseConnection?: boolean;

}
