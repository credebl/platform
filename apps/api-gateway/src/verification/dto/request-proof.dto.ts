import { ArrayNotEmpty, IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString, ValidateIf, ValidateNested, IsUUID, ArrayUnique, ArrayMaxSize } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { AutoAccept } from '@credebl/enum/enum';
import { IProofFormats } from '../interfaces/verification.interface';
import { ProofRequestType } from '../enum/verification.enum';

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

    @ApiPropertyOptional()
    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;
}

export class Filter {
  @ApiProperty()
  @IsString({ message: 'type must be in string' })
  @IsNotEmpty({ message: 'type is required.' })
  type: string;

  @ApiProperty()
  @IsString({ message: 'pattern must be in string' })
  @IsNotEmpty({ message: 'pattern is required.' })
  pattern: string;
}
export class Fields {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty({ message: 'path is required.' })
  path: string[];

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'filter is required.' })
  @ValidateNested()
  @Type(() => Filter)
  filter: Filter;
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

  @IsString()
  @IsNotEmpty({ message: 'id is required.' })
  id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  purpose: string;

  @ApiProperty({type: () =>  [InputDescriptors]})
  @IsNotEmpty({ message: 'inputDescriptors is required.' })
  @IsArray({ message: 'inputDescriptors must be an array' })
  @IsObject({ each: true })
  @Type(() => InputDescriptors)
  @ValidateNested()
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

export class RequestProofDto extends ProofPayload {
    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsUUID()
    @IsNotEmpty({ message: 'connectionId is required.' })
    connectionId: string;

    @ApiProperty({
      'example': 
      {
        'indy': {
          'attributes': [
            {
              attributeName: 'attributeName',
              condition: '>=',
              value: 'predicates',
              credDefId: 'string',
              schemaId: 'string'
            }
          ]
        }
    },
      type: () => [IndyDto]
  })
  @IsOptional()
  @ValidateNested()
  @IsObject({ message: 'ProofFormatDto must be an object' })
  @IsNotEmpty({ message: 'ProofFormatDto must not be empty' })
  @Type(() => IndyDto)
  proofFormats?: IndyDto;    

    @ApiProperty({
        'example': 
            {
                id: '32f54163-7166-48f1-93d8-ff217bdb0653',
                inputDescriptors: [
                    {
                      'id': 'healthcare_input_1',
                      'name': 'Medical History',
                      'schema': [
                        {
                          'uri': 'https://health-schemas.org/1.0.1/medical_history.json'
                        }
                        
                      ],
                      'constraints': {
                        'fields': [
                          {
                            'path': ['$.PatientID']
                          }
                        ]
                      }
                    }
                  ]
            },
       type: () => [ProofRequestPresentationDefinition]
    })
    @IsOptional()
    @ValidateNested()
    @IsObject({ message: 'presentationDefinition must be an object' })
    @IsNotEmpty({ message: 'presentationDefinition must not be empty' })
    @Type(() => ProofRequestPresentationDefinition)
    presentationDefinition?:ProofRequestPresentationDefinition;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    type:ProofRequestType;

    orgId: string;

    @ApiPropertyOptional()
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

export class SendProofRequestPayload {

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid goal code' })
    @IsString({ message: 'goal code should be string' })
    goalCode?: string;
    
    @ApiPropertyOptional()
    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    @ApiProperty({
        'example': {
                indy: {
                    name: 'Verify national identity',
                    version: '1.0',
                    // eslint-disable-next-line camelcase
                    requested_attributes: {
                        verifynameAddress: {
                            names: ['name', 'address'],
                            restrictions: [{ 'schema_id': 'KU583UbI4yAKfaBTSz1rqG:2:National ID:1.0.0' }]
                        },
                        verifyBirthPlace: {
                            name: 'Place',
                            restrictions: [{ 'schema_id': 'KU583UbI4yAKfaBTSz1rqG:2:Birth Certificate:1.0.0' }]
                        }
                    },
                    // eslint-disable-next-line camelcase
                    requested_predicates: {}
                }
            }
    })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid proofFormat' })
    @IsOptional()
    proofFormats?: IProofFormats;

    @ApiProperty({
        'example': 
            {
                id: '32f54163-7166-48f1-93d8-ff217bdb0653',
                inputDescriptors: [
                    {
                      'id': 'banking_input_1',
                      'name': 'Bank Account Information',
                      'schema': [
                        {
                          'uri': 'https://bank-schemas.org/1.0.0/accounts.json'
                        }
                        
                      ],
                      'constraints': {
                        'fields': [
                          {
                            'path': ['$.issuer.id'],
                            'filter': {
                              'type': 'string',
                              'pattern': 'did:example:123|did:example:456'
                            }
                          }
                        ]
                      }
                    }
                  ]
            },
       type: () => [ProofRequestPresentationDefinition]
    })
    @IsOptional()
    @ValidateNested()
    @IsObject({ message: 'presentationDefinition must be an object' })
    @IsNotEmpty({ message: 'presentationDefinition must not be empty' })
    @Type(() => ProofRequestPresentationDefinition)
    presentationDefinition?:ProofRequestPresentationDefinition;

    type:string;

    @ApiPropertyOptional()
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
